"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { supabaseBrowser } from "@/lib/supabase";

type Member = { nickname: string; created_at: string; is_admin: boolean };
type Stats = {
  members: number; today: number; week: number;
  posts: number; comments: number; postsToday: number;
  byBoard: { name: string; emoji: string; count: number }[];
  recent: Member[];
};

// 한국 시간 기준 오늘 0시
function kstMidnight(daysAgo = 0) {
  const now = new Date(Date.now() + 9 * 3600e3);
  now.setUTCHours(0, 0, 0, 0);
  return new Date(now.getTime() - 9 * 3600e3 - daysAgo * 86400e3).toISOString();
}

export default function AdminPage() {
  const { me, loading } = useUser();
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    if (!me?.isAdmin) return;
    const sb = supabaseBrowser();
    const count = (t: string, f?: (q: any) => any) => {
      let q: any = sb.from(t).select("*", { count: "exact", head: true });
      if (f) q = f(q);
      return q.then((r: any) => r.count ?? 0);
    };
    (async () => {
      const today = kstMidnight(), week = kstMidnight(6);
      const [members, td, wk, posts, comments, postsToday, boards, recent] = await Promise.all([
        count("profiles"),
        count("profiles", (q) => q.gte("created_at", today)),
        count("profiles", (q) => q.gte("created_at", week)),
        count("posts"),
        count("comments"),
        count("posts", (q) => q.gte("created_at", today)),
        sb.from("boards").select("slug,name,emoji").order("sort"),
        sb.from("profiles").select("nickname,created_at,is_admin").order("created_at", { ascending: false }).limit(10),
      ]);
      const byBoard = await Promise.all(
        (boards.data ?? []).map(async (b: any) => ({
          name: b.name, emoji: b.emoji, count: await count("posts", (q) => q.eq("board_slug", b.slug)),
        }))
      );
      setS({ members, today: td, week: wk, posts, comments, postsToday, byBoard, recent: (recent.data ?? []) as Member[] });
    })();
  }, [me]);

  if (loading) return <p className="empty">불러오는 중…</p>;
  if (!me?.isAdmin) return <p className="empty">관리자만 볼 수 있는 페이지예요.</p>;
  if (!s) return <p className="empty">집계 중…</p>;

  const box = (label: string, v: number) => (
    <div className="tile"><div className="desc">{label}</div><div style={{ fontSize: 28, fontWeight: 700 }}>{v.toLocaleString()}</div></div>
  );
  return (
    <section>
      <h1>관리자 대시보드</h1>
      <h2>회원</h2>
      <div className="board-tiles">{box("전체 회원", s.members)}{box("오늘 가입", s.today)}{box("최근 7일 가입", s.week)}</div>
      <h2>활동</h2>
      <div className="board-tiles">{box("전체 글", s.posts)}{box("오늘 올라온 글", s.postsToday)}{box("전체 댓글", s.comments)}</div>
      <h2>게시판별 글 수</h2>
      <ul className="plist">{s.byBoard.map((b) => <li key={b.name}>{b.emoji} {b.name} · <b>{b.count}</b></li>)}</ul>
      <h2>최근 가입자</h2>
      <ul className="plist">
        {s.recent.map((m) => (
          <li key={m.nickname}>{m.nickname}{m.is_admin ? " (관리자)" : ""} · <span className="meta">{new Date(m.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</span></li>
        ))}
      </ul>
      <p className="meta">
        방문자 수는 <Link href="https://vercel.com/23-353f/fashiondaily/analytics" target="_blank">Vercel 애널리틱스</Link>에서 볼 수 있어요.
      </p>
    </section>
  );
}
