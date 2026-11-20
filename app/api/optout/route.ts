import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { ptoken, suppress } from "@/lib/outreach";

async function go(req: Request) {
  const sp = new URL(req.url).searchParams;
  const id = sp.get("p") ?? "", t = sp.get("t") ?? "";
  if (!dbReady() || !/^\d+$/.test(id) || ptoken(id) !== t) return false;
  const [p] = await (await db())`SELECT email FROM prospects WHERE id = ${Number(id)}` as any[];
  if (p) await suppress(p.email, "unsubscribed");
  return !!p;
}
export async function GET(req: Request) {
  const ok = await go(req);
  return new NextResponse(`<!doctype html><meta name="viewport" content="width=device-width"><body style="font-family:Arial;padding:40px;text-align:center;color:#142133"><h1>${ok ? "You're unsubscribed" : "Link expired"}</h1><p>${ok ? "You won't hear from Lokly again." : "Reply to the email and we'll remove you right away."}</p></body>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
export async function POST(req: Request) { await go(req); return NextResponse.json({ ok: true }); }
