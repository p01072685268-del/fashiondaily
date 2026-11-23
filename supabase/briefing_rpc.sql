-- 매일 브리핑 자동 등록용 함수 (열쇠는 해시로만 저장)
create schema if not exists private;
create table if not exists private.settings (key text primary key, value text not null);
alter table private.settings enable row level security;
revoke all on schema private from anon, authenticated;
insert into private.settings (key, value) values ('briefing_key_sha256', '878109f7732fdf69cf8007069c88dbce251d68af3051085d6451bbf1f3a1f89a')
  on conflict (key) do update set value = excluded.value;

create or replace function public.post_briefing(p_key text, p_title text, p_body text)
returns bigint language plpgsql security definer set search_path = public, extensions as $$
declare new_id bigint;
begin
  if encode(digest(p_key, 'sha256'), 'hex') <> (select value from private.settings where key = 'briefing_key_sha256') then
    raise exception 'invalid key';
  end if;
  if exists (select 1 from posts where board_slug = 'briefing' and title = left(trim(p_title), 120)) then
    raise exception 'duplicate title';
  end if;
  insert into posts (board_slug, author_name, title, body)
    values ('briefing', '패션데일리', left(trim(p_title), 120), p_body)
    returning id into new_id;
  return new_id;
end $$;
revoke all on function public.post_briefing(text, text, text) from public;
grant execute on function public.post_briefing(text, text, text) to anon, authenticated;
