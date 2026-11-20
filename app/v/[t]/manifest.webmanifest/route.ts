import { db } from "@/lib/db";
import { verifyShare } from "@/lib/share";

// Per-business manifest so "Add to Home Screen" opens straight to that business's results.
export async function GET(_: Request, { params }: { params: Promise<{ t: string }> }) {
  const { t } = await params;
  const id = verifyShare(t);
  let name = "Lokly";
  if (id) { const sql = await db(); const [b] = await sql`SELECT name FROM businesses WHERE id = ${id}` as any[]; if (b) name = b.name; }
  return Response.json({
    name: `${name} · Google results`, short_name: name.slice(0, 18), start_url: `/v/${t}`, scope: `/v/${t}`,
    display: "standalone", background_color: "#F4F7F9", theme_color: "#142133",
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
