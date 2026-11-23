import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import { getBoards } from "@/lib/boards";
import type { Post } from "@/lib/types";
import { excerpt, timeAgo } from "@/lib/types";
import PostList from "@/components/PostList";
import Gallery from "@/components/Gallery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sb = supabaseServer();
  const boards = await getBoards();
  const names = Object.fromEntries(boards.map((b) => [b.slug, `${b.emoji} ${b.name}`]));

  const [brief, latest, popular, looks] = await Promise.all([
    sb.from("posts").select("*").eq("board_slug", "briefing").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("posts").select("*").neq("board_slug", "briefing").order("created_at", { ascending: false }).limit(10),
    sb.from("posts").select("*").gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString())
      .order("like_count", { ascending: false }).order("comment_count", { ascending: false }).limit(5),
    sb.from("posts").select("*").eq("board_slug", "dailylook").not("image_url", "is", null)
      .order("created_at", { ascending: false }).limit(6),
  ]);
  const b = brief.data as Post | null;

  return (
    <>
      <section className="hero">
        <h1>오늘의 패션, 매일 아침 한눈에</h1>
        <p>국내외 패션 소식 브리핑부터 세일 정보, 데일리룩까지. 같이 보고 같이 이야기해요.</p>
        <Link href="/login?mode=signup" className="btn big">무료로 가입하기</Link>
      </section>

      {b && (
        <section className="card brief">
          <div className="card-h">
            <h2>📰 오늘의 패션 브리핑</h2>
            <Link href="/b/briefing" className="more">지난 브리핑 →</Link>
          </div>
          <Link href={`/p/${b.id}`} className="brief-body">
            <strong>{b.title}</strong>
            <p>{excerpt(b.body, 140)}</p>
            <span className="meta">{timeAgo(b.created_at)} · 💬 {b.comment_count} · ❤️ {b.like_count}</span>
          </Link>
        </section>
      )}

      <div className="grid2">
        <section className="card">
          <div className="card-h"><h2>🆕 새 글</h2></div>
          <PostList posts={(latest.data as Post[]) ?? []} showBoard={names} />
        </section>
        <section className="card">
          <div className="card-h"><h2>🔥 이번 주 인기글</h2></div>
          <PostList posts={(popular.data as Post[]) ?? []} showBoard={names} />
        </section>
      </div>

      <section className="card">
        <div className="card-h">
          <h2>📸 데일리룩</h2>
          <Link href="/b/dailylook" className="more">더 보기 →</Link>
        </div>
        <Gallery posts={(looks.data as Post[]) ?? []} />
      </section>

      <section className="card">
        <div className="card-h"><h2>게시판</h2></div>
        <div className="board-tiles">
          {boards.map((bd) => (
            <Link key={bd.slug} href={`/b/${bd.slug}`} className="tile">
              <span className="emoji">{bd.emoji}</span>
              <strong>{bd.name}</strong>
              <span>{bd.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
