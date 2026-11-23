"use client";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { supabaseBrowser } from "@/lib/supabase";

export default function AuthButton() {
  const { me, loading } = useUser();
  if (loading) return <span className="auth" />;
  if (!me)
    return (
      <span className="auth">
        <Link href="/login" className="btn ghost">로그인</Link>
        <Link href="/login?mode=signup" className="btn">가입하기</Link>
      </span>
    );
  return (
    <span className="auth">
      <span className="nick">{me.nickname}님</span>
      <Link href="/write" className="btn">글쓰기</Link>
      <button className="btn ghost" onClick={() => supabaseBrowser().auth.signOut()}>로그아웃</button>
    </span>
  );
}
