import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schedulePost } from "@/lib/ayrshare";

// Admin: schedule a drafted post to a client's linked socials, and log it in their results feed.
export async function POST(req: Request) {
  const f = await req.formData();
  if (!process.env.ADMIN_KEY || f.get("key") !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const sql = await db();
  const biz = String(f.get("b") ?? "");
  const [b] = await sql`SELECT social FROM businesses WHERE id = ${biz}` as any[];
  const back = new URL(`/admin/posts?key=${encodeURIComponent(String(f.get("key")))}`, req.url);
  if (!b?.social?.profileKey) { back.searchParams.set("err", "Client hasn't connected their socials yet"); return NextResponse.redirect(back, 303); }
  const text = String(f.get("text") ?? ""), photo = String(f.get("photo") ?? "");
  const when = String(f.get("when") ?? "");
  try {
    await schedulePost(b.social.profileKey, { text, mediaUrl: /^https:\/\//.test(photo) ? photo : undefined, when: when || undefined, platforms: String(f.get("platforms") ?? "instagram,facebook").split(",") });
    await sql`INSERT INTO results (business_id, kind, title, detail) VALUES (${biz}, 'Social post', ${String(f.get("label") ?? "Post scheduled")}, ${text.slice(0, 140)})`;
    back.searchParams.set("ok", "1");
  } catch (e) { back.searchParams.set("err", (e as Error).message); }
  return NextResponse.redirect(back, 303);
}
