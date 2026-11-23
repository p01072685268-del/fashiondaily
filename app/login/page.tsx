"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

// 카카오 개발자 앱과 Supabase Kakao 설정, supabase/kakao.sql 실행이 끝나면 true 로 바꾸세요.
const KAKAO_ON = false;

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [nick, setNick] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg("");
    const sb = supabaseBrowser();
    if (mode === "signup") {
      if (nick.trim().length < 2 || nick.trim().length > 20) return setErr("닉네임은 2~20자로 정해 주세요.");
      if (pw.length < 6) return setErr("비밀번호는 6자 이상이어야 해요.");
      setBusy(true);
      const { data: taken } = await sb.from("profiles").select("id").eq("nickname", nick.trim()).maybeSingle();
      if (taken) { setBusy(false); return setErr("이미 쓰고 있는 닉네임이에요."); }
      const { data, error } = await sb.auth.signUp({
        email, password: pw,
        options: { data: { nickname: nick.trim() }, emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) return setErr(error.message.includes("registered") ? "이미 가입된 이메일이에요." : "가입하지 못했어요. 입력한 내용을 확인해 주세요.");
      if (!data.session) return setMsg("가입 확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요!");
      router.push("/b/notice");
    } else {
      setBusy(true);
      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      setBusy(false);
      if (error) return setErr("이메일 또는 비밀번호가 맞지 않아요.");
      router.push("/");
    }
  }

  async function kakao() {
    setErr("");
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: window.location.origin },
    });
    if (error) setErr("카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  return (
    <section className="card narrow">
      <h1>{mode === "signup" ? "패션데일리 가입하기" : "로그인"}</h1>
      {KAKAO_ON && (
        <>
          <button type="button" className="btn big kakao" onClick={kakao}>카카오로 3초 만에 시작하기</button>
          <p className="or">또는 이메일로</p>
        </>
      )}
      <form onSubmit={submit} className="form">
        <label>이메일<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label>비밀번호<input type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
        {mode === "signup" && (
          <label>닉네임<input required value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} placeholder="커뮤니티에서 쓸 이름" /></label>
        )}
        {err && <p className="err">{err}</p>}
        {msg && <p className="ok">{msg}</p>}
        <button className="btn big" disabled={busy}>{busy ? "잠시만요…" : mode === "signup" ? "가입하기" : "로그인"}</button>
      </form>
      <p className="switch">
        {mode === "signup" ? "이미 회원이신가요? " : "아직 회원이 아니신가요? "}
        <button className="link" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setErr(""); setMsg(""); }}>
          {mode === "signup" ? "로그인" : "가입하기"}
        </button>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
