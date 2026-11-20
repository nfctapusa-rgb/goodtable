import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify, newToken, editUrl, menuUrl } from "@/lib/menus";
import { sendEmail } from "@/lib/email";

// Free Lokly Menu sign-up: creates a published menu page and emails the private edit link.
export async function POST(req: Request) {
  const f = await req.formData();
  const s = (k: string, n = 120) => String(f.get(k) ?? "").trim().slice(0, n);
  const name = s("name", 80), email = s("email", 120).toLowerCase();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.redirect(new URL("/menu?err=1", req.url), 303);
  const sql = await db();
  let slug = slugify(`${name} ${s("city", 40)}`.trim());
  for (let i = 0; i < 5; i++) { const [x] = await sql`SELECT 1 FROM menus WHERE slug = ${slug}` as any[]; if (!x) break; slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`; }
  const token = newToken();
  const starter = { sections: [{ name: "Popular", items: [{ name: "Your best dish", desc: "Tap Edit to describe it", price: "" }] }], specials: [], hours: "", about: "" };
  await sql`INSERT INTO menus (slug, edit_token, name, email, phone, city, kind, data) VALUES (${slug}, ${token}, ${name}, ${email}, ${s("phone", 30) || null}, ${s("city", 60) || null}, ${s("kind", 20) || "restaurant"}, ${JSON.stringify(starter)}::jsonb)`;
  await sql`INSERT INTO leads (kind, source, business_name, email, phone, city, data) VALUES ('menu', 'lokly-menu', ${name}, ${email}, ${s("phone", 30) || null}, ${s("city", 60) || null}, ${JSON.stringify({ slug, kind: s("kind", 20) })})`.catch(() => null);
  await sendEmail(email, `Your free ${name} menu is live`, `<p>Hi! Your Lokly Menu is live at <a href="${menuUrl(slug)}">${menuUrl(slug)}</a>.</p>
    <p><b>Your private edit link</b> (keep it safe, anyone with it can edit):<br><a href="${editUrl(token)}">${editUrl(token)}</a></p>
    <p>Add your logo, banner, menu items, prices and specials. Print the QR code or put it on a Lokly NFC tap card so guests open the menu with one tap.</p><p>— Lokly</p>`).catch(() => null);
  return NextResponse.redirect(new URL(`/menu/edit/${token}?new=1`, req.url), 303);
}
