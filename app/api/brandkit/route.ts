import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, businessFor } from "@/lib/auth";
import { refreshBrandKit } from "@/lib/brandkit";

// GET: the signed-in owner's brand kit (first business, or ?b=). POST: update website and re-pull.
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ kit: null });
  const sql = await db();
  const b = new URL(req.url).searchParams.get("b");
  const [biz] = (b ? [await businessFor(user.id, b)] : await sql`SELECT b.* FROM businesses b JOIN memberships m ON m.business_id = b.id WHERE m.user_id = ${user.id} ORDER BY b.created_at LIMIT 1`) as any[];
  if (!biz) return NextResponse.json({ kit: null });
  return NextResponse.json({ business: { id: biz.id, name: biz.name, address: biz.address, phone: biz.phone, website: biz.website }, kit: biz.assets, email: user.email });
}

export async function POST(req: Request) {
  const f = await req.formData();
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const bizId = String(f.get("b") ?? "");
  if (!(await businessFor(user.id, bizId))) return new NextResponse("Not found", { status: 404 });
  const site = String(f.get("website") ?? "").trim().slice(0, 300);
  const sql = await db();
  if (site) await sql`UPDATE businesses SET website = ${/^https?:\/\//.test(site) ? site : "https://" + site} WHERE id = ${bizId}`;
  await refreshBrandKit(bizId);
  return NextResponse.redirect(new URL(`/dashboard?b=${bizId}#brand`, req.url), 303);
}
