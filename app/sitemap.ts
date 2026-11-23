import type { MetadataRoute } from "next";
import { INDUSTRIES } from "@/lib/showcase";
import { POSTS } from "@/lib/blog";
import { db, dbReady } from "@/lib/db";

export const revalidate = 3600;

// Live menu pages (/m/[slug]) with at least one section. Empty menus are left out
// so Google only sees pages with real content. Never let a DB hiccup break the sitemap.
async function menuUrls(b: string): Promise<MetadataRoute.Sitemap> {
  if (!dbReady()) return [];
  try {
    const sql = await db();
    const rows = await sql`SELECT slug, updated_at FROM menus WHERE published AND jsonb_array_length(data->'sections') > 0 ORDER BY updated_at DESC LIMIT 5000` as any[];
    return rows.map(r => ({ url: `${b}/m/${r.slug}`, lastModified: r.updated_at ? new Date(r.updated_at) : undefined, changeFrequency: "weekly" as const, priority: 0.6 }));
  } catch { return []; }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const b = "https://lokly.pro";
  const pages = ["", "/grader", "/features", "/results", "/industries", "/compare", "/pricing", "/how-it-works", "/mailers",
    "/faq", "/es", "/ko", "/blog", "/menu", "/menus", ...POSTS.map(p => `/blog/${p.slug}`), ...Object.keys(INDUSTRIES).map(k => `/industries/${k}`)].map(p => ({ url: b + p, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));
  return [...pages, ...(await menuUrls(b))];
}
