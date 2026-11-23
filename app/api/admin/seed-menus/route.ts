import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { cleanData, newToken, menuUrl } from "@/lib/menus";
import { EXAMPLE_MENUS } from "@/lib/example-menus";

// Admin only: create or refresh the example menus (Corleone Pizza, Flamebachi).
// Visit /api/admin/seed-menus while logged in as an admin. Safe to run again.
export async function GET() {
  const u = await currentUser();
  if (!u?.is_admin) return new NextResponse("Not found", { status: 404 });
  const sql = await db();
  const out = [];
  for (const m of EXAMPLE_MENUS) {
    const data = JSON.stringify(cleanData(m.data));
    const [x] = await sql`SELECT id FROM menus WHERE slug = ${m.slug}` as any[];
    if (x) await sql`UPDATE menus SET name = ${m.name}, phone = ${m.phone}, address = ${m.address}, city = ${m.city}, website = ${m.website}, kind = ${m.kind}, logo = ${m.logo}, color = ${m.color}, theme = ${m.theme}, data = ${data}::jsonb, published = true, updated_at = now() WHERE id = ${x.id}`;
    else await sql`INSERT INTO menus (slug, edit_token, name, email, phone, address, city, website, kind, logo, color, theme, data) VALUES (${m.slug}, ${newToken()}, ${m.name}, 'hello@lokly.pro', ${m.phone}, ${m.address}, ${m.city}, ${m.website}, ${m.kind}, ${m.logo}, ${m.color}, ${m.theme}, ${data}::jsonb)`;
    out.push({ name: m.name, url: menuUrl(m.slug), updated: !!x });
  }
  return NextResponse.json({ ok: true, menus: out });
}
