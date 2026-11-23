import Link from "next/link";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/types";

export default function PostList({ posts, showBoard }: { posts: Post[]; showBoard?: Record<string, string> }) {
  if (!posts.length) return <p className="empty">아직 글이 없어요. 첫 글을 남겨 보세요!</p>;
  return (
    <ul className="plist">
      {posts.map((p) => (
        <li key={p.id} className={p.is_pinned ? "pinned" : ""}>
          <Link href={`/p/${p.id}`}>
            {p.is_pinned && <span className="tag">공지</span>}
            {showBoard && <span className="bname">{showBoard[p.board_slug]}</span>}
            <span className="ptitle">{p.title}</span>
            {p.comment_count > 0 && <span className="ccount">[{p.comment_count}]</span>}
          </Link>
          <span className="meta">
            {p.author_name} · {timeAgo(p.created_at)} · 조회 {p.view_count} · ❤️ {p.like_count}
          </span>
        </li>
      ))}
    </ul>
  );
}
