import Link from "next/link";
import type { Post } from "@/lib/types";

export default function Gallery({ posts }: { posts: Post[] }) {
  if (!posts.length) return <p className="empty">아직 사진이 없어요. 첫 데일리룩을 올려 보세요!</p>;
  return (
    <div className="gallery">
      {posts.map((p) => (
        <Link key={p.id} href={`/p/${p.id}`} className="gcard">
          {p.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image_url} alt={p.title} loading="lazy" />
          ) : (
            <div className="noimg">📸</div>
          )}
          <div className="gmeta">
            <strong>{p.title}</strong>
            <span>{p.author_name} · ❤️ {p.like_count} · 💬 {p.comment_count}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
