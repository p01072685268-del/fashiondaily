-- 패션데일리 데이터베이스 설정
-- Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run 을 누르세요. (한 번만)

-- ───────── 회원 프로필 ─────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 20),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  nick text := coalesce(nullif(trim(new.raw_user_meta_data->>'nickname'), ''), split_part(new.email, '@', 1));
begin
  if exists (select 1 from public.profiles where nickname = nick) then
    nick := left(nick, 15) || '_' || substr(md5(random()::text), 1, 4);
  end if;
  insert into public.profiles (id, nickname) values (new.id, nick);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ───────── 게시판 ─────────
create table if not exists public.boards (
  slug text primary key,
  name text not null,
  description text not null default '',
  emoji text not null default '',
  sort int not null default 0,
  admin_only boolean not null default false,
  kind text not null default 'list' check (kind in ('list', 'gallery', 'poll'))
);

-- ───────── 게시글 ─────────
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  board_slug text not null references public.boards(slug),
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '',
  image_url text,
  is_pinned boolean not null default false,
  view_count int not null default 0,
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists posts_board_idx on public.posts (board_slug, is_pinned desc, created_at desc);

-- ───────── 댓글 ─────────
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ───────── 좋아요 ─────────
create table if not exists public.likes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

-- ───────── 투표 ─────────
create table if not exists public.poll_options (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  sort int not null default 0,
  vote_count int not null default 0
);
create table if not exists public.poll_votes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_id bigint not null references public.poll_options(id) on delete cascade,
  primary key (post_id, user_id)
);

-- ───────── 숫자 자동 집계 ─────────
create or replace function public.bump_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'likes' then
    update posts set like_count = like_count + (case when tg_op = 'INSERT' then 1 else -1 end)
      where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'comments' then
    update posts set comment_count = comment_count + (case when tg_op = 'INSERT' then 1 else -1 end)
      where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'poll_votes' then
    update poll_options set vote_count = vote_count + (case when tg_op = 'INSERT' then 1 else -1 end)
      where id = coalesce(new.option_id, old.option_id);
  end if;
  return null;
end $$;

drop trigger if exists likes_count on public.likes;
create trigger likes_count after insert or delete on public.likes for each row execute function public.bump_counts();
drop trigger if exists comments_count on public.comments;
create trigger comments_count after insert or delete on public.comments for each row execute function public.bump_counts();
drop trigger if exists votes_count on public.poll_votes;
create trigger votes_count after insert or delete on public.poll_votes for each row execute function public.bump_counts();

create or replace function public.add_view(pid bigint)
returns void language sql security definer set search_path = public as $$
  update posts set view_count = view_count + 1 where id = pid;
$$;

-- 글쓴이 이름은 항상 본인 닉네임으로 저장 (사칭 방지)
create or replace function public.set_author_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.author_id := auth.uid();
    new.author_name := (select nickname from profiles where id = auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists posts_author on public.posts;
create trigger posts_author before insert on public.posts for each row execute function public.set_author_name();
drop trigger if exists comments_author on public.comments;
create trigger comments_author before insert on public.comments for each row execute function public.set_author_name();

-- 회원이 고정·조회수·좋아요 숫자를 직접 바꾸지 못하게
create or replace function public.protect_post_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  -- 회원이 직접 수정할 때만 막고, 좋아요·댓글 자동 집계는 통과
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.is_pinned := old.is_pinned;
    new.view_count := old.view_count;
    new.like_count := old.like_count;
    new.comment_count := old.comment_count;
    new.author_id := old.author_id;
    new.author_name := old.author_name;
    new.board_slug := old.board_slug;
    new.post_type := old.post_type;
  end if;
  return new;
end $$;
drop trigger if exists posts_protect on public.posts;
create trigger posts_protect before update on public.posts for each row execute function public.protect_post_fields();

-- ───────── 권한 (누가 무엇을 할 수 있나) ─────────
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select using (true);
drop policy if exists "read boards" on public.boards;
create policy "read boards" on public.boards for select using (true);
drop policy if exists "read posts" on public.posts;
create policy "read posts" on public.posts for select using (true);
drop policy if exists "read comments" on public.comments;
create policy "read comments" on public.comments for select using (true);
drop policy if exists "read likes" on public.likes;
create policy "read likes" on public.likes for select using (true);
drop policy if exists "read options" on public.poll_options;
create policy "read options" on public.poll_options for select using (true);
drop policy if exists "read votes" on public.poll_votes;
create policy "read votes" on public.poll_votes for select using (true);

drop policy if exists "write posts" on public.posts;
create policy "write posts" on public.posts for insert to authenticated with check (
  author_id = auth.uid()
  and (public.is_admin() or not (select admin_only from public.boards b where b.slug = board_slug))
);
drop policy if exists "edit own posts" on public.posts;
create policy "edit own posts" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin());
drop policy if exists "delete own posts" on public.posts;
create policy "delete own posts" on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists "write comments" on public.comments;
create policy "write comments" on public.comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "delete own comments" on public.comments;
create policy "delete own comments" on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists "like" on public.likes;
create policy "like" on public.likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "unlike" on public.likes;
create policy "unlike" on public.likes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "add options" on public.poll_options;
create policy "add options" on public.poll_options for insert to authenticated with check (
  exists (select 1 from public.posts p where p.id = post_id and (p.author_id = auth.uid() or public.is_admin()))
);
drop policy if exists "vote" on public.poll_votes;
create policy "vote" on public.poll_votes for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.poll_options o where o.id = option_id and o.post_id = poll_votes.post_id)
);

-- ───────── 사진 저장소 (데일리룩) ─────────
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
  on conflict (id) do nothing;
drop policy if exists "upload photos" on storage.objects;
create policy "upload photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "read photos" on storage.objects;
create policy "read photos" on storage.objects for select using (bucket_id = 'photos');

-- ───────── 게시판 7개 ─────────
insert into public.boards (slug, name, description, emoji, sort, admin_only, kind) values
  ('notice',   '공지·가입인사',     '패션데일리 소식과 새 회원 인사',              '📢', 1, false, 'list'),
  ('briefing', '오늘의 패션 브리핑', '매일 아침 정리하는 국내외 패션 소식',          '📰', 2, true,  'list'),
  ('sale',     '세일·할인',         '지금 놓치면 안 되는 세일과 쿠폰 정보',          '🔥', 3, false, 'list'),
  ('release',  '콜라보·발매',       '콜라보, 신제품 발매, 드로우 일정',              '🤝', 4, false, 'list'),
  ('dailylook','데일리룩 인증',     '오늘 입은 옷을 사진으로 자랑해 주세요',         '📸', 5, false, 'gallery'),
  ('free',     '자유·질문',         '코디 고민, 사이즈 질문, 아무 이야기나',          '💬', 6, false, 'list'),
  ('poll',     '투표·이벤트',       '여러분의 선택을 들려주세요',                    '🗳️', 7, false, 'poll')
on conflict (slug) do update set name = excluded.name, description = excluded.description,
  emoji = excluded.emoji, sort = excluded.sort, admin_only = excluded.admin_only, kind = excluded.kind;

-- ───────── API 접근 권한 ─────────
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on public.posts, public.comments, public.likes, public.poll_options, public.poll_votes to authenticated;
grant execute on function public.add_view(bigint) to anon, authenticated;

-- ───────── 나만의 아이템 추천: 일반/업계 구분 (2026-11-24) ─────────
alter table public.posts add column if not exists post_type text not null default 'general'
  check (post_type in ('general', 'industry'));
