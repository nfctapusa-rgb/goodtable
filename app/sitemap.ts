import type { MetadataRoute } from "next";
import { INDUSTRIES } from "@/lib/showcase";
export default function sitemap(): MetadataRoute.Sitemap {
  const b = "https://lokly.pro";
  return ["", "/grader", "/features", "/results", "/industries", "/compare", "/pricing", "/how-it-works", "/mailers",
    ...Object.keys(INDUSTRIES).map(k => `/industries/${k}`)].map(p => ({ url: b + p, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));
}
