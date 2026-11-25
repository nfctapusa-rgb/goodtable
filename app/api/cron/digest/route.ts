import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

// Every morning: one email to the owner with everything that happened in the last 24h.
// Goes to DIGEST_TO (falls back to EMAIL_REPLY_TO, which forwards to the owner's Gmail).
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ok = (process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`) || (process.env.ADMIN_KEY && u.searchParams.get("key") === process.env.ADMIN_KEY);
  if (!ok) return new NextResponse("Unauthorized", { status: 401 });
  if (!dbReady()) return NextResponse.json({ ok: false });
  const to = process.env.DIGEST_TO || process.env.EMAIL_REPLY_TO;
  if (!to) return NextResponse.json({ ok: false, error: "No DIGEST_TO" });
  const sql = await db();
  const day = "24 hours";
  const q = async (p: Promise<any>) => { try { return await p; } catch { return []; } };
  const leads = await q(sql`SELECT kind, source, business_name, email, phone, score, created_at FROM leads WHERE created_at > now() - ${day}::interval ORDER BY created_at DESC LIMIT 60`);
  const [out] = await q(sql`SELECT count(*) FILTER (WHERE last_sent_at > now() - ${day}::interval)::int AS sent, count(*) FILTER (WHERE clicked_at > now() - ${day}::interval)::int AS clicked,
      count(*) FILTER (WHERE report_at > now() - ${day}::interval)::int AS reports, count(*) FILTER (WHERE replied_at > now() - ${day}::interval)::int AS replied,
      count(*) FILTER (WHERE status IN ('new','active','queued') OR next_send_at IS NOT NULL)::int AS queued, count(*)::int AS total FROM prospects`);
  const [pros] = await q(sql`SELECT coalesce(sum(found),0)::int AS found, coalesce(sum(emails),0)::int AS emails, coalesce(sum(calls),0)::int AS calls, count(*)::int AS searches FROM prospector_queries WHERE ran_at > now() - ${day}::interval`);
  const [waiting] = await q(sql`SELECT count(*)::int AS n FROM prospects WHERE source = 'auto-prospector' AND status = 'new'`);
  const orders = await q(sql`SELECT type, created_at FROM billing_events WHERE created_at > now() - ${day}::interval ORDER BY created_at DESC`);
  const menus = await q(sql`SELECT m.name, count(s.*)::int AS n FROM menu_scans s JOIN menus m ON m.id = s.menu_id WHERE s.created_at > now() - ${day}::interval GROUP BY 1 ORDER BY 2 DESC LIMIT 10`);
  const taps = await q(sql`SELECT b.name, count(*)::int AS n FROM taps t JOIN businesses b ON b.id = t.business_id WHERE t.created_at > now() - ${day}::interval GROUP BY 1 ORDER BY 2 DESC`);
  const newMenus = leads.filter((l: any) => l.kind === "menu");
  const hot = leads.filter((l: any) => ["onboarding", "signup", "menu"].includes(l.kind));
  const reports = leads.filter((l: any) => l.kind === "report");
  const li = (s: string) => `<li style="margin:4px 0">${s}</li>`;
  const esc = (s: any) => String(s ?? "").replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
  const sec = (title: string, items: string[], empty: string) => `<h3 style="margin:18px 0 6px">${title}</h3>${items.length ? `<ul style="padding-left:18px;margin:0">${items.join("")}</ul>` : `<p style="color:#888;margin:0">${empty}</p>`}`;
  const k = encodeURIComponent(process.env.ADMIN_KEY ?? "");
  const html = `<div style="font:15px/1.5 system-ui,sans-serif;max-width:560px;margin:auto;padding:20px">
    <h2 style="margin:0">Lokly daily: ${hot.length} new signup${hot.length === 1 ? "" : "s"}, ${orders.length} order${orders.length === 1 ? "" : "s"}</h2>
    <p style="color:#666;margin:4px 0 0">Last 24 hours</p>
    ${sec("Call these first", hot.map((l: any) => li(`<b>${esc(l.business_name) || "(no name)"}</b> · ${esc(l.kind === "menu" ? "free menu" : l.kind)} · ${esc(l.email)}${l.phone ? ` · <a href="tel:${esc(l.phone)}">${esc(l.phone)}</a>` : ""}`)), "No new signups.")}
    ${sec("Shopify orders paid", orders.map((o: any) => li(`${esc(o.type)} at ${new Date(o.created_at).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })}`)), "No orders.")}
    ${sec("Free Google reports run", reports.slice(0, 15).map((l: any) => li(`${esc(l.business_name)}${l.score != null ? ` · ${l.score}/100` : ""}${l.source ? ` · from ${esc(l.source)}` : ""}${l.email ? ` · ${esc(l.email)}` : ""}`)), "None.")}
    ${sec("Email outreach", [li(`${out?.sent ?? 0} sent · ${out?.clicked ?? 0} clicked · ${out?.reports ?? 0} ran a report · ${out?.replied ?? 0} replied`), li(`${out?.total ?? 0} leads total`), li(`Auto-prospector: ${pros?.searches ?? 0} searches · ${pros?.emails ?? 0} new email leads · ${pros?.calls ?? 0} new call-list leads${waiting?.n ? ` · ${waiting.n} waiting for your OK before emailing` : ""}`)], "")}
    ${sec("Menu scans", menus.map((m: any) => li(`${esc(m.name)}: ${m.n}`)), "No menu scans.")}
    ${sec("Review card taps", taps.map((t: any) => li(`${esc(t.name)}: ${t.n}`)), "No taps.")}
    ${newMenus.length ? `<p>New menu signups get the NFC card offer automatically.</p>` : ""}
    <p style="margin-top:20px"><a href="https://lokly.pro/admin?key=${k}" style="background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open admin</a></p>
  </div>`;
  await sendEmail(to, `Lokly daily: ${hot.length} signups, ${orders.length} orders, ${reports.length} reports`, html, {});
  return NextResponse.json({ ok: true, to, signups: hot.length, orders: orders.length, reports: reports.length });
}
