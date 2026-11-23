import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * 매일 브리핑 자동 등록용 주소.
 * POST /api/briefing  (헤더: Authorization: Bearer <BRIEFING_SECRET>)
 * 본문: { "title": "...", "body": "마크다운 내용" }
 */
export async function POST(req: Request) {
  const secret = process.env.BRIEFING_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { title, body } = await req.json().catch(() => ({}));
  if (typeof title !== "string" || typeof body !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin()
    .from("posts")
    .insert({ board_slug: "briefing", author_name: "패션데일리", title: title.trim().slice(0, 120), body })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
