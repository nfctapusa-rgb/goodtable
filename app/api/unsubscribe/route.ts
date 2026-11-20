import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db, dbReady } from "@/lib/db";
import { unsubToken } from "@/lib/email";

const ok = (u: string, t: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(u) || !t) return false;
  const exp = unsubToken(u);
  return t.length === exp.length && timingSafeEqual(Buffer.from(t), Buffer.from(exp));
};
async function optOut(req: Request) {
  const p = new URL(req.url).searchParams;
  const u = p.get("u") ?? "", t = p.get("t") ?? "";
  if (!dbReady() || !ok(u, t)) return false;
  const sql = await db();
  await sql`UPDATE users SET email_opt_out = true WHERE id = ${u}`;
  return true;
}
// GET from the email link, POST for one-click List-Unsubscribe.
export async function GET(req: Request) {
  const done = await optOut(req);
  return new NextResponse(`<!doctype html><meta name="viewport" content="width=device-width"><body style="font-family:Arial;padding:40px;text-align:center;color:#142133"><h1>${done ? "You're unsubscribed" : "Link expired"}</h1><p>${done ? "You won't get any more marketing emails from Lokly. Account and billing emails still arrive." : "Reply to any Lokly email and we'll remove you."}</p><p><a href="/">Back to Lokly</a></p></body>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
export async function POST(req: Request) { await optOut(req); return NextResponse.json({ ok: true }); }
