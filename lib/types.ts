export type Board = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  sort: number;
  admin_only: boolean;
  kind: "list" | "gallery" | "poll";
};

export type Post = {
  id: number;
  board_slug: string;
  author_id: string | null;
  author_name: string;
  title: string;
  body: string;
  image_url: string | null;
  is_pinned: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
};

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export function excerpt(md: string, n = 80) {
  const t = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*>|`_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}
