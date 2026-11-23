"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

/** 조회수 +1, 그리고 본인 글이면 삭제 버튼 */
export default function PostActions({ postId, authorId, boardSlug }: { postId: number; authorId: string | null; boardSlug: string }) {
  const { me } = useUser();
  const router = useRouter();

  useEffect(() => {
    const key = `viewed-${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    supabaseBrowser().rpc("add_view", { pid: postId });
  }, [postId]);

  if (!me || (me.user.id !== authorId && !me.isAdmin)) return null;

  async function del() {
    if (!confirm("이 글을 삭제할까요?")) return;
    const { error } = await supabaseBrowser().from("posts").delete().eq("id", postId);
    if (!error) { router.push(`/b/${boardSlug}`); router.refresh(); }
  }
  return <button className="btn ghost small" onClick={del}>글 삭제</button>;
}
