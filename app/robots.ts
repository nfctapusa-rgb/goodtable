import type { MetadataRoute } from "next";
// Open to search engines and AI assistants (ChatGPT, Claude, Perplexity, Google AI) so they can recommend Lokly.
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api/", "/dashboard", "/menu/edit/", "/v/", "/app"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot"].map(userAgent => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: "https://lokly.pro/sitemap.xml",
    host: "https://lokly.pro",
  };
}
