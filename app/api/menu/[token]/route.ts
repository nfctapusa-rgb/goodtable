import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanData, okImage, THEMES } from "@/lib/menus";
// Save from the editor. The edit token is the only key.
export async function PUT(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const sql = await db();
  const [m] = await sql`SELECT id FROM menus WHERE edit_token = ${token}` as any[];
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : null);
  const color = /^#[0-9a-fA-F]{6}$/.test(b.color ?? "") ? b.color : "#E30A23";
  const data = cleanData(b.data);
  if (JSON.stringify(data).length > 3_500_000) return NextResponse.json({ error: "Too many photos. Remove a few item photos and save again." }, { status: 413 });
  await sql`UPDATE menus SET name = coalesce(${str(b.name, 80)}, name), phone = ${str(b.phone, 30)}, address = ${str(b.address, 160)}, city = ${str(b.city, 60)},
    website = ${/^https?:\/\//.test(b.website ?? "") ? str(b.website, 200) : null}, logo = ${okImage(b.logo) ?? null}, banner = ${okImage(b.banner) ?? null}, color = ${color}, theme = ${b.theme in THEMES ? b.theme : null},
    data = ${JSON.stringify(data)}::jsonb, published = ${b.published !== false}, updated_at = now() WHERE id = ${m.id}`;
  return NextResponse.json({ ok: true });
}
