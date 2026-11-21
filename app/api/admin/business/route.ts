import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Admin-only: set a business's Google stats report link and link it to its LeadSnap location.
export async function POST(req: Request) {
  const f = await req.formData();
  if (!process.env.ADMIN_KEY || f.get("key") !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const id = String(f.get("id") ?? ""), url = String(f.get("stats_url") ?? "").trim();
  if (url && !/^https:\/\//.test(url)) return new NextResponse("Link must start with https://", { status: 400 });
  const plan = String(f.get("plan") ?? "");
  const ls = String(f.get("leadsnap_id") ?? "").trim();
  if (ls && !/^\d+$/.test(ls)) return new NextResponse("LeadSnap location ID must be a number", { status: 400 });
  const sql = await db();
  await sql`UPDATE businesses SET stats_url = ${url || null}, leadsnap_id = ${ls || null}, plan = COALESCE(NULLIF(${plan}, ''), plan) WHERE id = ${id}`;
  const email = String(f.get("email") ?? "").trim(), pid = String(f.get("place_id") ?? "").trim();
  if (f.has("email")) await sql`UPDATE businesses SET email = ${email || null} WHERE id = ${id}`;
  if (f.has("place_id")) await sql`UPDATE businesses SET place_id = ${pid || null} WHERE id = ${id}`;
  return NextResponse.redirect(new URL(`/admin?key=${encodeURIComponent(String(f.get("key")))}#clients`, req.url), 303);
}
