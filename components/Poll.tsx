"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type O = { id: number; label: string; vote_count: number };

export default function Poll({ postId }: { postId: number }) {
  const { me } = useUser();
  const router = useRouter();
  const [opts, setOpts] = useState<O[]>([]);
  const [mine, setMine] = useState<number | null>(null);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data } = await sb.from("poll_options").select("id,label,vote_count").eq("post_id", postId).order("sort");
    setOpts((data as O[]) ?? []);
    if (me) {
      const { data: v } = await sb.from("poll_votes").select("option_id").eq("post_id", postId).eq("user_id", me.user.id).maybeSingle();
      setMine(v?.option_id ?? null);
    }
  }, [postId, me]);

  useEffect(() => { load(); }, [load]);

  if (!opts.length) return null;
  const total = opts.reduce((s, o) => s + o.vote_count, 0);
  const voted = mine !== null;

  async function vote(id: number) {
    if (!me) return router.push("/login");
    if (voted) return;
    const { error } = await supabaseBrowser().from("poll_votes").insert({ post_id: postId, user_id: me.user.id, option_id: id });
    if (!error) load();
  }

  return (
    <div className="poll">
      <p className="poll-h">🗳️ 투표 {voted ? `· 총 ${total}명 참여` : "· 하나를 골라 주세요"}</p>
      {opts.map((o) => {
        const pct = total ? Math.round((o.vote_count / total) * 100) : 0;
        return (
          <button key={o.id} className={`opt ${mine === o.id ? "mine" : ""}`} onClick={() => vote(o.id)} disabled={voted}>
            {voted && <span className="bar" style={{ width: `${pct}%` }} />}
            <span className="olabel">{mine === o.id ? "✔ " : ""}{o.label}</span>
            {voted && <span className="opct">{pct}% ({o.vote_count})</span>}
          </button>
        );
      })}
      {!me && <p className="login-hint">로그인하면 투표할 수 있어요.</p>}
    </div>
  );
}
