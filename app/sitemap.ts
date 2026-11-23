import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { supabaseServer } from "@/lib/supabase";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = supabaseServer();
  const [{ data: boards }, { data: posts }] = await Promise.all([
    sb.from("boards").select("slug").order("sort"),
    sb.from("posts").select("id,created_at").order("id", { ascending: false }).limit(5000),
  ]);
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    ...(boards ?? []).map((b) => ({ url: `${SITE}/b/${b.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...(posts ?? []).map((p) => ({ url: `${SITE}/p/${p.id}`, lastModified: p.created_at, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
