import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Admin cleanup: delete test leads by business name, and a test business account (with its owner if they have nothing else).
export async function POST(req: Request) {
  const f = await req.formData();
  if (!process.env.ADMIN_KEY || f.get("key") !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const sql = await db();
  const names = String(f.get("names") ?? "").split("|").map(s => s.trim()).filter(Boolean);
  const out: any = {};
  if (names.length) out.leads = (await sql`DELETE FROM leads WHERE kind IN ('report','signup','onboarding') AND business_name ILIKE ANY(${names.map(n => n + "%")}) RETURNING id` as any[]).length;
  const bid = String(f.get("business") ?? "");
  if (bid) {
    const owners = await sql`SELECT user_id FROM memberships WHERE business_id = ${bid}` as any[];
    out.business = (await sql`DELETE FROM businesses WHERE id = ${bid} RETURNING id` as any[]).length;
    for (const o of owners) {
      const left = await sql`SELECT 1 FROM memberships WHERE user_id = ${o.user_id} LIMIT 1` as any[];
      if (!left.length) out.users = (out.users ?? 0) + (await sql`DELETE FROM users WHERE id = ${o.user_id} RETURNING id` as any[]).length;
    }
  }
  return NextResponse.json(out);
}
