import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Admin: log something we did for a client. It shows in their dashboard under "What we did for you".
export async function POST(req: Request) {
  const f = await req.formData();
  if (!process.env.ADMIN_KEY || f.get("key") !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const s = (k: string, n: number) => String(f.get(k) ?? "").trim().slice(0, n) || null;
  const url = s("url", 500);
  if (s("title", 200)) await (await db())`INSERT INTO results (business_id, kind, title, detail, url) VALUES (${String(f.get("b"))}, ${s("kind", 30) ?? "Update"}, ${s("title", 200)}, ${s("detail", 500)}, ${url && /^https?:\/\//.test(url) ? url : null})`;
  return NextResponse.redirect(new URL(`/admin?key=${encodeURIComponent(String(f.get("key")))}#onboarding`, req.url), 303);
}
