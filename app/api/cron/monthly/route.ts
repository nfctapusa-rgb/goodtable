import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { magicUrl, signInHtml } from "@/lib/magic";

export const runtime = "nodejs";
export const maxDuration = 60;

// 1st of each month: every paying client's owner gets "your results are ready" with a 7-day sign-in link.
// Sent from CLIENT_EMAIL_FROM (e.g. "Mark at Lokly <mark@lokly.pro>"), kept apart from the cold-outreach sender.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ok = (process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`) || (process.env.ADMIN_KEY && u.searchParams.get("key") === process.env.ADMIN_KEY);
  if (!ok) return new NextResponse("Unauthorized", { status: 401 });
  if (!dbReady()) return NextResponse.json({ ok: false });
  const sql = await db();
  const rows = await sql`SELECT DISTINCT ON (u.id) u.id, u.email, u.name, b.name AS biz,
      (SELECT count(*) FROM results r WHERE r.business_id = b.id AND r.created_at > now() - interval '31 days')::int AS done
    FROM businesses b JOIN memberships m ON m.business_id = b.id AND m.role = 'owner' JOIN users u ON u.id = m.user_id
    WHERE b.plan <> 'free' AND b.status IN ('active','trial') AND NOT u.is_admin ORDER BY u.id, b.created_at` as any[];
  const month = new Date(Date.now() - 5 * 864e5).toLocaleString("en-US", { month: "long", timeZone: "America/Los_Angeles" });
  let sent = 0;
  for (const r of rows) {
    const intro = `Your ${month} results for <b>${r.biz}</b> are in: your Google calls, views and reviews${r.done ? `, plus the ${r.done} things we did for you this month` : ""}. Tap below to open your dashboard. The link works for 7 days.`;
    await sendEmail(r.email, `Your ${month} results for ${r.biz}`, signInHtml(r.name, magicUrl(r.id, 7), intro), { from: process.env.CLIENT_EMAIL_FROM || undefined })
      .then(() => sent++).catch(e => console.error("monthly email failed", r.email, e));
  }
  return NextResponse.json({ ok: true, clients: rows.length, sent });
}
