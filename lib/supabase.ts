import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: SupabaseClient | null = null;

/** 브라우저(로그인 상태 유지)용 */
export function supabaseBrowser() {
  if (!browserClient) browserClient = createClient(url, anon);
  return browserClient;
}

/** 서버에서 공개 글을 읽을 때 */
export function supabaseServer() {
  return createClient(url, anon, { auth: { persistSession: false } });
}

/** 서버 전용(관리자 권한). 브리핑 자동 등록에만 사용 */
export function supabaseAdmin() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
