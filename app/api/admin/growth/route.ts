import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scan, locate } from "@/lib/rankgrid";

export const maxDuration = 60;
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);

// Admin growth tools. Body: { key, action, business_id, ... }
//  review_link: give the business a lokly.pro/t/<code> link for NFC review cards (finds its Google place id too)
//  scan: run a 5x5 local rank map for { keyword, step? }
//  set: { place_id?, email? }
export async function POST(req: Request) {
  const form = !(req.headers.get("content-type") ?? "").includes("json");
  const body: any = form ? Object.fromEntries((await req.formData()).entries()) : await req.json().catch(() => null);
  const back = (msg: string) => NextResponse.redirect(new URL(`/admin?key=${encodeURIComponent(body.key)}&msg=${encodeURIComponent(msg)}#clients`, req.url), 303);
  const reply = (j: any, status = 200) => form ? back(j.error ?? j.msg ?? "Done") : NextResponse.json(j, { status });
  if (!process.env.ADMIN_KEY || body?.key !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const sql = await db();
  const [b] = await sql`SELECT id, name, place_id, address, tap_code FROM businesses WHERE id = ${body.business_id}` as any[];
  if (!b) return NextResponse.json({ error: "No such business" }, { status: 404 });
  try {
    if (body.action === "set") {
      await sql`UPDATE businesses SET place_id = coalesce(${body.place_id || null}, place_id), email = coalesce(${body.email || null}, email) WHERE id = ${b.id}`;
      return reply({ ok: true, msg: "Saved" });
    }
    if (body.action === "review_link") {
      if (!b.place_id) { const l = await locate(null, b.name, b.address).catch(() => null); if (l) await sql`UPDATE businesses SET place_id = ${l.id} WHERE id = ${b.id}`; }
      let code = b.tap_code;
      if (!code) {
        const base = slug(body.code || b.name) || "biz";
        for (let i = 0; i < 20 && !code; i++) {
          const c = i ? `${base}-${i + 1}` : base;
          const [hit] = await sql`SELECT 1 FROM businesses WHERE tap_code = ${c}` as any[];
          if (!hit) { await sql`UPDATE businesses SET tap_code = ${c} WHERE id = ${b.id}`; code = c; }
        }
      }
      return reply({ ok: true, link: `https://lokly.pro/t/${code}`, msg: `${b.name} review card link: https://lokly.pro/t/${code} (program this into the NFC card)` });
    }
    if (body.action === "scan") {
      const kw = String(body.keyword ?? "").trim();
      if (!kw) return reply({ error: "Add a keyword, like 'pizza near me'" }, 400);
      const r = await scan(b.id, kw, Number(body.step) || 0.5);
      return reply({ ok: true, ...r, msg: `${b.name} rank map for "${kw}": top 3 in ${r.top3} of 25 spots, average rank ${r.avg}. It's on their results page.` });
    }
  } catch (e: any) { return reply({ error: e.message }, 500); }
  return reply({ error: "Unknown action" }, 400);
}
