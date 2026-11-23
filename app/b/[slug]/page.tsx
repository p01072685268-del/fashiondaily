import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import type { Board, Post } from "@/lib/types";
import PostList from "@/components/PostList";
import Gallery from "@/components/Gallery";

export const dynamic = "force-dynamic";
const PER = 20;

async function getBoard(slug: string) {
  const { data } = await supabaseServer().from("boards").select("*").eq("slug", slug).maybeSingle();
  return data as Board | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = await getBoard((await params).slug);
  return b ? { title: b.name, description: `${b.description} | 패션데일리`, alternates: { canonical: `/b/${b.slug}` }, openGraph: { title: `${b.name} | 패션데일리`, description: b.description, url: `/b/${b.slug}` } } : {};
}

export default async function BoardPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const board = await getBoard(slug);
  if (!board) notFound();

  const from = (page - 1) * PER;
  const { data, count } = await supabaseServer()
    .from("posts").select("*", { count: "exact" }).eq("board_slug", slug)
    .order("is_pinned", { ascending: false }).order("created_at", { ascending: false })
    .range(from, from + PER - 1);
  const posts = (data as Post[]) ?? [];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER));

  return (
    <section className="card">
      <div className="card-h">
        <div>
          <h1>{board.emoji} {board.name}</h1>
          <p className="desc">{board.description}</p>
        </div>
        {!board.admin_only && <Link href={`/write?board=${slug}`} className="btn">글쓰기</Link>}
      </div>
      {board.kind === "gallery" ? <Gallery posts={posts} /> : <PostList posts={posts} />}
      {pages > 1 && (
        <nav className="pager">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/b/${slug}?page=${n}`} className={n === page ? "on" : ""}>{n}</Link>
          ))}
        </nav>
      )}
    </section>
  );
}
