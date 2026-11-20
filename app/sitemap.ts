import type { MetadataRoute } from "next";
import { INDUSTRIES } from "@/lib/showcase";
import { POSTS } from "@/lib/blog";
export default function sitemap(): MetadataRoute.Sitemap {
  const b = "https://lokly.pro";
  return ["", "/grader", "/features", "/results", "/industries", "/compare", "/pricing", "/how-it-works", "/mailers",
    "/faq", "/blog", "/menu", "/menus", ...POSTS.map(p => `/blog/${p.slug}`), ...Object.keys(INDUSTRIES).map(k => `/industries/${k}`)].map(p => ({ url: b + p, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));
}
