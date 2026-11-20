import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { TEMPLATES, sendTemplate } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

// Daily (vercel.json). Vercel sends Authorization: Bearer $CRON_SECRET.
// Sends each upgrade nudge once, on its day, only to accounts with no paid business.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Not found", { status: 404 });
  if (!dbReady()) return NextResponse.json({ ok: false, reason: "no database" });
  const sql = await db();
  const sent: Record<string, number> = {};
  for (const [name, t] of Object.entries(TEMPLATES)) {
    if (t.day == null) continue;
    // Eligible: signed up at least `day` days ago (and no more than day+7, so old accounts aren't blasted), not opted out,
    // no business on a paid plan, and this template not sent yet.
    const users = (await sql`SELECT u.id FROM users u
      WHERE u.created_at <= now() - make_interval(days => ${t.day}) AND u.created_at > now() - make_interval(days => ${t.day + 7})
        AND NOT u.email_opt_out AND NOT u.is_admin
        AND NOT EXISTS (SELECT 1 FROM memberships m JOIN businesses b ON b.id = m.business_id
          WHERE m.user_id = u.id AND b.plan <> 'free' AND b.status IN ('active','trial','past_due','pending'))
        AND NOT EXISTS (SELECT 1 FROM email_log e WHERE e.user_id = u.id AND e.template = ${name})
      LIMIT 200`) as any[];
    for (const u of users) await sendTemplate(u.id, name);
    sent[name] = users.length;
  }
  return NextResponse.json({ ok: true, sent });
}
