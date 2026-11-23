-- 카카오 로그인 회원의 닉네임을 카카오 이름으로 정하기
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  nick text := left(coalesce(
    nullif(trim(new.raw_user_meta_data->>'nickname'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'preferred_username'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    '회원'), 20);
begin
  if char_length(nick) < 2 then nick := nick || '님'; end if;
  if exists (select 1 from public.profiles where nickname = nick) then
    nick := left(nick, 15) || '_' || substr(md5(random()::text), 1, 4);
  end if;
  insert into public.profiles (id, nickname) values (new.id, nick);
  return new;
end $$;
