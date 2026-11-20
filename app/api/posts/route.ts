import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, businessFor } from "@/lib/auth";
import { publish } from "@/lib/autopilot";

// Owner actions on this week's posts: approve, edit+approve, skip, or toggle autopilot.
export async function POST(req: Request) {
  const f = await req.formData();
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const bizId = String(f.get("b") ?? "");
  if (!(await businessFor(user.id, bizId))) return new NextResponse("Not found", { status: 404 });
  const sql = await db();
  const action = String(f.get("action") ?? "");
  if (action === "autopilot") {
    const on = f.get("on") === "1";
    await sql`UPDATE businesses SET social = COALESCE(social, '{}'::jsonb) || ${JSON.stringify({ autopilot: on })}::jsonb WHERE id = ${bizId}`;
  } else {
    const id = Number(f.get("post"));
    const [p] = await sql`SELECT id, status FROM posts WHERE id = ${id} AND business_id = ${bizId}` as any[];
    if (p && p.status === "pending") {
      if (action === "skip") await sql`UPDATE posts SET status = 'skipped' WHERE id = ${id}`;
      else {
        const cap = String(f.get("caption") ?? "").trim().slice(0, 2000);
        if (cap) await sql`UPDATE posts SET caption = ${cap} WHERE id = ${id}`;
        await publish(id);
      }
    }
  }
  return NextResponse.redirect(new URL(`/dashboard?b=${bizId}#posts`, req.url), 303);
}
