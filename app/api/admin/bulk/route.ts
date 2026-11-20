import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedTasks } from "@/lib/accounts";
import { shareUrl } from "@/lib/share";

// Admin: add/update managed clients by LeadSnap location (no owner login needed) and return their view links.
// Body: { key, clients: [{ name, leadsnap, phone?, website?, address?, plan?, snapshot? }] }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!process.env.ADMIN_KEY || body?.key !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const sql = await db();
  const out = [];
  for (const c of body.clients ?? []) {
    const ls = String(c.leadsnap ?? "");
    if (!c.name || !/^\d+$/.test(ls)) continue;
    const snap = c.snapshot ? JSON.stringify(c.snapshot) : null;
    let [b] = await sql`SELECT id FROM businesses WHERE leadsnap_id = ${ls} ORDER BY created_at LIMIT 1` as any[];
    if (b) await sql`UPDATE businesses SET name = ${c.name}, phone = coalesce(${c.phone ?? null}, phone), website = coalesce(${c.website ?? null}, website), address = coalesce(${c.address ?? null}, address), snapshot = coalesce(${snap}::jsonb, snapshot), status = 'active' WHERE id = ${b.id}`;
    else {
      const plan = ["local", "site", "pro"].includes(c.plan) ? c.plan : "local";
      [b] = await sql`INSERT INTO businesses (name, website, plan, status, leadsnap_id, phone, address, snapshot) VALUES (${c.name}, ${c.website ?? null}, ${plan}, 'active', ${ls}, ${c.phone ?? null}, ${c.address ?? null}, ${snap}::jsonb) RETURNING id` as any[];
      await seedTasks(b.id, plan);
      await sql`UPDATE tasks SET done = true, done_at = now() WHERE business_id = ${b.id} AND key IN ('google', 'google_accept', 'optimize', 'posts', 'assets')`;
    }
    out.push({ name: c.name, leadsnap: ls, link: shareUrl(b.id) });
  }
  return NextResponse.json(out);
}
