"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { timeAgo } from "@/lib/types";

type C = { id: number; author_id: string | null; author_name: string; body: string; created_at: string };

export default function Comments({ postId }: { postId: number }) {
  const { me } = useUser();
  const [list, setList] = useState<C[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabaseBrowser()
      .from("comments").select("id,author_id,author_name,body,created_at")
      .eq("post_id", postId).order("created_at");
    setList((data as C[]) ?? []);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !text.trim()) return;
    setBusy(true); setErr("");
    const { error } = await supabaseBrowser().from("comments").insert({
      post_id: postId, author_id: me.user.id, author_name: me.nickname, body: text.trim(),
    });
    setBusy(false);
    if (error) return setErr("댓글을 남기지 못했어요. 잠시 후 다시 시도해 주세요.");
    setText("");
    load();
  }

  async function remove(id: number) {
    if (!confirm("댓글을 지울까요?")) return;
    await supabaseBrowser().from("comments").delete().eq("id", id);
    load();
  }

  return (
    <section className="comments">
      <h3>댓글 {list.length}</h3>
      <ul>
        {list.map((c) => (
          <li key={c.id}>
            <div className="cmeta">
              <strong>{c.author_name}</strong> <span>{timeAgo(c.created_at)}</span>
              {me && (me.user.id === c.author_id || me.isAdmin) && (
                <button className="link" onClick={() => remove(c.id)}>삭제</button>
              )}
            </div>
            <p>{c.body}</p>
          </li>
        ))}
      </ul>
      {me ? (
        <form onSubmit={submit} className="cform">
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
            placeholder="따뜻한 댓글을 남겨 주세요" rows={3} />
          <button className="btn" disabled={busy || !text.trim()}>{busy ? "등록 중…" : "댓글 등록"}</button>
          {err && <p className="err">{err}</p>}
        </form>
      ) : (
        <p className="login-hint"><Link href="/login">로그인</Link>하고 댓글을 남겨 보세요.</p>
      )}
    </section>
  );
}
