# 패션데일리

매일 패션 소식을 나누는 커뮤니티 사이트입니다. (Next.js + Supabase, Vercel 배포)

- 게시판 7개: 공지·가입인사 / 오늘의 패션 브리핑 / 세일·할인 / 콜라보·발매 / 데일리룩 인증 / 자유·질문 / 투표·이벤트
- 회원가입(이메일), 글쓰기, 댓글, 좋아요, 투표, 데일리룩 사진 올리기
- 브리핑 자동 등록: `POST /api/briefing` (헤더 `Authorization: Bearer $BRIEFING_SECRET`, 본문 `{ "title", "body" }`)

## 처음 설정
1. Supabase SQL Editor에서 `supabase/schema.sql` → `supabase/seed.sql` 순서로 실행
2. Vercel 환경변수 (NEXT_PUBLIC_ 값은 Type을 Config로): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BRIEFING_SECRET`
3. 사이트에서 가입한 뒤 운영자 지정: `update profiles set is_admin = true where nickname = '내닉네임';`
