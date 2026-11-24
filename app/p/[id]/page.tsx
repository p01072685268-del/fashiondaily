import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import type { Board, Post } from "@/lib/types";
import { excerpt, timeAgo } from "@/lib/types";
import Markdown from "@/components/Markdown";
import LikeButton from "@/components/LikeButton";
import Comments from "@/components/Comments";
import Poll from "@/components/Poll";
import PostActions from "@/components/PostActions";

export const dynamic = "force-dynamic";

async function getPost(id: string) {
  if (!/^\d+$/.test(id)) return null;
  const { data } = await supabaseServer().from("posts").select("*").eq("id", id).maybeSingle();
  return data as Post | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await getPost((await params).id);
  if (!p) return {};
  return {
    title: p.title,
    description: excerpt(p.body, 120),
    alternates: { canonical: `/p/${p.id}` },
    openGraph: { type: "article", title: p.title, description: excerpt(p.body, 120), url: `/p/${p.id}`, publishedTime: p.created_at, images: p.image_url ? [p.image_url] : undefined },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const post = await getPost((await params).id);
  if (!post) notFound();
  const { data: board } = await supabaseServer().from("boards").select("*").eq("slug", post.board_slug).single();
  const b = board as Board;

  return (
    <article className="card post">
      <Link href={`/b/${b.slug}`} className="crumb">{b.emoji} {b.name}</Link>
      <h1>{post.post_type === "industry" && <span className="tag ad">광고·협찬</span>}{post.title}</h1>
      {post.post_type === "industry" && <p className="meta">브랜드·업계 관계자가 쓴 추천 글이에요. 경제적 이해관계가 있을 수 있어요.</p>}
      <div className="meta row">
        <span>{post.author_name} · {timeAgo(post.created_at)} · 조회 {post.view_count}</span>
        <PostActions postId={post.id} authorId={post.author_id} boardSlug={b.slug} />
      </div>
      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="post-img" src={post.image_url} alt={post.title} />
      )}
      <Markdown>{post.body}</Markdown>
      <Poll postId={post.id} />
      <div className="actions">
        <LikeButton postId={post.id} initial={post.like_count} />
      </div>
      <Comments postId={post.id} />
    </article>
  );
}
