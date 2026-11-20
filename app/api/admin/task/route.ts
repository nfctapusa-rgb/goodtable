import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setPlan } from "@/lib/accounts";
import type { PlanId } from "@/lib/plans";

// Admin: tick an onboarding task, or activate a business after collecting payment by hand.
export async function POST(req: Request) {
  const f = await req.formData();
  if (!process.env.ADMIN_KEY || f.get("key") !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const sql = await db();
  const biz = String(f.get("b") ?? "");
  if (f.get("task")) await sql`UPDATE tasks SET done = NOT done, done_at = CASE WHEN done THEN NULL ELSE now() END WHERE business_id = ${biz} AND key = ${String(f.get("task"))}`;
  if (f.get("addon")) {
    const a = String(f.get("addon"));
    await sql`UPDATE businesses SET addons = CASE WHEN addons ? ${a} THEN addons - ${a} ELSE addons || ${JSON.stringify([a])}::jsonb END WHERE id = ${biz}`;
  }
  if (f.get("status")) {
    const [b] = await sql`SELECT plan FROM businesses WHERE id = ${biz}` as any[];
    const st = String(f.get("status"));
    const trial = st === "trial" ? new Date(Date.now() + 90 * 864e5).toISOString() : null;
    if (b && ["active", "trial", "past_due", "canceled", "pending"].includes(st)) await setPlan(biz, b.plan as PlanId, st as any, { trialEnds: trial });
  }
  return NextResponse.redirect(new URL(`/admin?key=${encodeURIComponent(String(f.get("key")))}#clients`, req.url), 303);
}
