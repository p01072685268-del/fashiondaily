"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export default function LikeButton({ postId, initial }: { postId: number; initial: number }) {
  const { me } = useUser();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me) return;
    supabaseBrowser()
      .from("likes").select("post_id").eq("post_id", postId).eq("user_id", me.user.id)
      .maybeSingle().then(({ data }) => setLiked(!!data));
  }, [me, postId]);

  async function toggle() {
    if (!me) return router.push("/login");
    if (busy) return;
    setBusy(true);
    const sb = supabaseBrowser();
    if (liked) {
      const { error } = await sb.from("likes").delete().eq("post_id", postId).eq("user_id", me.user.id);
      if (!error) { setLiked(false); setCount((c) => c - 1); }
    } else {
      const { error } = await sb.from("likes").insert({ post_id: postId, user_id: me.user.id });
      if (!error) { setLiked(true); setCount((c) => c + 1); }
    }
    setBusy(false);
  }

  return (
    <button className={`like ${liked ? "on" : ""}`} onClick={toggle} aria-pressed={liked}>
      {liked ? "❤️" : "🤍"} 좋아요 {count}
    </button>
  );
}
