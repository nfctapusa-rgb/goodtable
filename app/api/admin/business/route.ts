import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Admin-only: set a business's Google stats report link (e.g. a Localo white-label report).
export async function POST(req: Request) {
  const f = await req.formData();
  if (!process.env.ADMIN_KEY || f.get("key") !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const id = String(f.get("id") ?? ""), url = String(f.get("stats_url") ?? "").trim();
  if (url && !/^https:\/\//.test(url)) return new NextResponse("Link must start with https://", { status: 400 });
  const plan = String(f.get("plan") ?? "");
  const sql = await db();
  await sql`UPDATE businesses SET stats_url = ${url || null}, plan = COALESCE(NULLIF(${plan}, ''), plan) WHERE id = ${id}`;
  return NextResponse.redirect(new URL(`/admin?key=${encodeURIComponent(String(f.get("key")))}#clients`, req.url), 303);
}
