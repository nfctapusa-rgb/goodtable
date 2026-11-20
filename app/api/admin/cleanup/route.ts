import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ONE-TIME: removes Mark's test data from Nov 19, 2026 (approved in chat). Delete this file after it runs.
const CUTOFF = "2026-11-20T05:20:00Z";
const TEST_EMAILS = ["mossjr1126@gmail.com", "1-radios-forge@icloud.com", "mr@gmail.com"];

export async function POST(req: Request) {
  const f = await req.formData();
  if (!process.env.ADMIN_KEY || f.get("key") !== process.env.ADMIN_KEY || f.get("confirm") !== "delete-test-data") return new NextResponse("Not found", { status: 404 });
  const sql = await db();
  const users = await sql`SELECT id FROM users WHERE NOT is_admin AND created_at < ${CUTOFF} AND (lower(email) = ANY(${TEST_EMAILS}) OR email LIKE 'test+%@lokly.pro')` as any[];
  const ids = users.map(u => u.id);
  const biz = await sql`DELETE FROM businesses WHERE id IN (SELECT business_id FROM memberships WHERE user_id = ANY(${ids}::uuid[])) RETURNING id` as any[];
  const u = await sql`DELETE FROM users WHERE id = ANY(${ids}::uuid[]) RETURNING id` as any[];
  const l = await sql`DELETE FROM leads WHERE created_at < ${CUTOFF} RETURNING id` as any[];
  const p = await sql`DELETE FROM prospects WHERE lower(email) IN ('nfctapusa@gmail.com') RETURNING id` as any[];
  const fe = await sql`DELETE FROM funnel_events WHERE created_at < ${CUTOFF} RETURNING id` as any[];
  const a = await sql`DELETE FROM audit_log WHERE business_id = ANY(${biz.map(b => b.id)}::uuid[]) RETURNING id` as any[];
  return NextResponse.json({ users: u.length, businesses: biz.length, leads: l.length, prospects: p.length, funnelEvents: fe.length, auditRows: a.length });
}
