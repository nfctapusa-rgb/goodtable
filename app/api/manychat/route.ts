import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { track } from "@/lib/track";

// ManyChat "External Request" action, fired when someone comments GRADE.
// POST https://lokly.pro/api/manychat with header  Authorization: Bearer <MANYCHAT_SECRET>
// and body {"ig": "{{username}}", "keyword": "GRADE", "post": "{{last_interaction_post_id}}"} (all optional).
// Returns the DM link so ManyChat can map it into a custom field if you prefer.
export async function POST(req: Request) {
  const secret = process.env.MANYCHAT_SECRET;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || got.length !== secret.length || !timingSafeEqual(Buffer.from(got), Buffer.from(secret)))
    return new NextResponse("Not found", { status: 404 });
  const b = await req.json().catch(() => ({}));
  const ig = String(b.ig ?? "").replace(/[^\w.]/g, "").slice(0, 40) || undefined;
  await track("ig_comment", { attr: { s: "instagram", m: "comment", c: String(b.keyword ?? "grade").toLowerCase().slice(0, 40) }, meta: { ig, post: String(b.post ?? "").slice(0, 80) || undefined } });
  const origin = new URL(req.url).origin;
  return NextResponse.json({ ok: true, link: `${origin}/ig?c=grade${ig ? `&h=${ig}` : ""}` });
}
