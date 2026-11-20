import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { suppress } from "@/lib/outreach";

// Resend (Svix-signed) events: bounces and spam complaints go on the do-not-contact list.
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET ?? "";
  const id = req.headers.get("svix-id"), ts = req.headers.get("svix-timestamp"), sigs = req.headers.get("svix-signature") ?? "";
  if (!secret || !id || !ts || Math.abs(Date.now() / 1000 - Number(ts)) > 600) return new NextResponse("bad", { status: 401 });
  const exp = createHmac("sha256", Buffer.from(secret.replace(/^whsec_/, ""), "base64")).update(`${id}.${ts}.${raw}`).digest("base64");
  if (!sigs.split(" ").some(s => { const v = s.split(",")[1] ?? ""; return v.length === exp.length && timingSafeEqual(Buffer.from(v), Buffer.from(exp)); })) return new NextResponse("bad", { status: 401 });
  const ev = JSON.parse(raw);
  const to: string[] = ev.data?.to ?? [];
  if (ev.type === "email.bounced") for (const e of to) await suppress(e, "bounced");
  if (ev.type === "email.complained") for (const e of to) await suppress(e, "complaint");
  if (ev.type === "email.delivered" && ev.data?.email_id) await (await db())`UPDATE prospects SET notes = NULL WHERE resend_id = ${ev.data.email_id}`;
  return NextResponse.json({ ok: true });
}
