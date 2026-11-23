"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import type { Board } from "@/lib/types";

function WriteForm() {
  const { me, loading } = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [slug, setSlug] = useState(params.get("board") ?? "free");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabaseBrowser().from("boards").select("*").order("sort").then(({ data }) => setBoards((data as Board[]) ?? []));
  }, []);

  const board = boards.find((b) => b.slug === slug);
  const usable = boards.filter((b) => !b.admin_only || me?.isAdmin);

  if (loading) return null;
  if (!me) return (
    <section className="card"><p><Link href="/login">로그인</Link>하면 글을 쓸 수 있어요.</p></section>
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setErr("");
    if (!title.trim()) return setErr("제목을 적어 주세요.");
    if (board?.kind === "gallery" && !file) return setErr("데일리룩은 사진을 1장 올려 주세요.");
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (board?.kind === "poll" && opts.length < 2) return setErr("투표 항목을 2개 이상 적어 주세요.");
    if (file && file.size > 5 * 1024 * 1024) return setErr("사진은 5MB 이하로 올려 주세요.");

    setBusy(true);
    const sb = supabaseBrowser();
    let image_url: string | null = null;
    if (file) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${me.user.id}/${Date.now()}.${ext}`;
      const up = await sb.storage.from("photos").upload(path, file, { contentType: file.type });
      if (up.error) { setBusy(false); return setErr("사진을 올리지 못했어요. 다시 시도해 주세요."); }
      image_url = sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
    }
    const { data, error } = await sb.from("posts").insert({
      board_slug: slug, author_id: me.user.id, author_name: me.nickname,
      title: title.trim(), body: body.trim(), image_url,
    }).select("id").single();
    if (error || !data) { setBusy(false); return setErr("글을 올리지 못했어요. 잠시 후 다시 시도해 주세요."); }
    if (board?.kind === "poll") {
      await sb.from("poll_options").insert(opts.map((label, i) => ({ post_id: data.id, label, sort: i })));
    }
    router.push(`/p/${data.id}`);
  }

  return (
    <section className="card">
      <h1>글쓰기</h1>
      <form onSubmit={submit} className="form">
        <label>게시판
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {usable.map((b) => <option key={b.slug} value={b.slug}>{b.emoji} {b.name}</option>)}
          </select>
        </label>
        <label>제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="제목을 입력하세요" />
        </label>
        {board?.kind === "gallery" && (
          <label>사진 (필수, 5MB 이하)
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        )}
        <label>내용
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10}
            placeholder={board?.kind === "gallery" ? "착용한 브랜드나 코디 포인트를 적어 주세요" : "내용을 입력하세요. 링크는 [이름](주소) 형식으로 쓸 수 있어요."} />
        </label>
        {board?.kind === "poll" && (
          <fieldset>
            <legend>투표 항목</legend>
            {options.map((o, i) => (
              <input key={i} value={o} maxLength={60} placeholder={`항목 ${i + 1}`}
                onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} />
            ))}
            {options.length < 8 && (
              <button type="button" className="btn ghost small" onClick={() => setOptions([...options, ""])}>+ 항목 추가</button>
            )}
          </fieldset>
        )}
        {err && <p className="err">{err}</p>}
        <button className="btn big" disabled={busy}>{busy ? "올리는 중…" : "등록하기"}</button>
      </form>
    </section>
  );
}

export default function WritePage() {
  return <Suspense><WriteForm /></Suspense>;
}
