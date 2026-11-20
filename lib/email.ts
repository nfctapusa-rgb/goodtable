import { createHmac } from "crypto";
import { db, dbReady } from "./db";

// Resend over REST (no SDK). Needs RESEND_API_KEY and EMAIL_FROM (e.g. "Lokly <hello@lokly.pro>", domain verified in Resend).
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://lokly.pro";
const signKey = () => process.env.EMAIL_SIGNING_SECRET || process.env.CRON_SECRET || "";

export const unsubToken = (userId: string) => createHmac("sha256", signKey()).update(`unsub:${userId}`).digest("base64url").slice(0, 32);
export const unsubUrl = (userId: string) => `${SITE()}/api/unsubscribe?u=${userId}&t=${unsubToken(userId)}`;

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function layout(title: string, paras: string[], cta: { label: string; href: string } | null, userId: string, marketing: boolean) {
  return `<!doctype html><html><body style="margin:0;background:#F4F7F9;font-family:Arial,Helvetica,sans-serif;color:#142133">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #DCE3E9;border-radius:16px">
<tr><td style="padding:22px 28px;border-bottom:1px solid #DCE3E9;font-weight:800;font-size:22px;color:#142133"><img src="${SITE()}/pin-96.png" width="28" height="28" alt="" style="vertical-align:-6px;border:0"> Lokly</td></tr>
<tr><td style="padding:26px 28px">
<h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">${esc(title)}</h1>
${paras.map(p => `<p style="font-size:15px;line-height:1.55;margin:0 0 14px">${p}</p>`).join("")}
${cta ? `<p style="margin:22px 0 4px"><a href="${cta.href}" style="background:#142133;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700;display:inline-block">${esc(cta.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #DCE3E9;font-size:12px;color:#5F6B7A">Lokly · Local marketing for small businesses${marketing ? ` · <a href="${unsubUrl(userId)}" style="color:#5F6B7A">Unsubscribe</a>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string, opts: { userId?: string; marketing?: boolean; from?: string } = {}) {
  const key = process.env.RESEND_API_KEY, from = opts.from || process.env.EMAIL_FROM;
  if (!key || !from) return { skipped: true };
  const headers: Record<string, string> = {};
  if (opts.marketing && opts.userId) { headers["List-Unsubscribe"] = `<${unsubUrl(opts.userId)}>`; headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, headers, ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}) }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
}

export interface Ctx { userId: string; email: string; name: string | null; business: string; score: number | null; issues: number; businessId: string | null }

// Templates. `day` = days after signup when the follow-up cron sends it (only to accounts still on the free plan).
export const TEMPLATES: Record<string, { day?: number; marketing: boolean; build: (c: Ctx) => { subject: string; html: string } }> = {
  welcome: { marketing: false, build: c => ({
    subject: `Your Lokly report for ${c.business} is saved`,
    html: layout(`Hi ${c.name ? esc(c.name.split(" ")[0]) : "there"}, your full report is ready`, [
      c.score != null ? `<b>${esc(c.business)}</b> scored <b>${c.score}/100</b>${c.issues ? ` with <b>${c.issues} issues</b> holding you back on Google` : ""}.` : `Your report for <b>${esc(c.business)}</b> is saved to your account.`,
      "Your dashboard shows every issue in order of impact, plus how to fix each one. You can rescan any time to track your progress.",
    ], { label: "See my full report", href: `${SITE()}/dashboard` }, c.userId, false) }) },
  nudge_fix: { day: 2, marketing: true, build: c => ({
    subject: `${c.business}: the 3 fixes that matter most`,
    html: layout("Start with these three", [
      `Most of the points ${esc(c.business)} is missing come from a few fixes: a complete Google profile, fresh weekly posts, and replies to every review.`,
      "Google rewards active profiles. Businesses that post weekly and answer reviews show up more often in the map results near them.",
      "You can do it yourself from your report, or let us do it for <b>$25/month</b>, cancel anytime.",
    ], { label: "Let Lokly fix it", href: `${SITE()}/pricing?src=email&utm_source=email&utm_campaign=nudge_fix` }, c.userId, true) }) },
  nudge_competitors: { day: 5, marketing: true, build: c => ({
    subject: "Who's showing up instead of you",
    html: layout("Your competitors are getting your calls", [
      `When someone nearby searches for what ${esc(c.business)} sells, Google shows three businesses on the map. Your report shows who's ranking ahead of you right now.`,
      "Lokly Google Management handles your profile, posts, photos and review replies every week, and emails you your numbers each month.",
    ], { label: "Check my rankings", href: `${SITE()}/dashboard?utm_source=email&utm_campaign=nudge_competitors` }, c.userId, true) }) },
  nudge_last: { day: 10, marketing: true, build: c => ({
    subject: `Should we take ${c.business} off our list?`,
    html: layout("Last note from us", [
      "We haven't heard back, so this is the last reminder we'll send about your report.",
      "If you want more calls and direction requests from Google, reply to this email or start Google Management for $25/month. Your free NFC review card ships with it.",
    ], { label: "Start for $25/mo", href: `${SITE()}/start?plan=local&src=email&utm_source=email&utm_campaign=nudge_last` }, c.userId, true) }) },
  payment_failed: { marketing: false, build: c => ({
    subject: "Your Lokly payment didn't go through",
    html: layout("Please update your card", [
      `We couldn't charge your card for ${esc(c.business)}. Stripe will retry automatically, but updating your card now keeps your Google profile managed without a gap.`,
    ], { label: "Update payment method", href: `${SITE()}/dashboard` }, c.userId, false) }) },
  canceled: { marketing: false, build: c => ({
    subject: "Your Lokly subscription has ended",
    html: layout("Sorry to see you go", [
      `Your subscription for ${esc(c.business)} is canceled and you won't be charged again. Your account and reports stay available on the free plan.`,
      "If something didn't work for you, just reply. We read every message.",
    ], { label: "Restart anytime", href: `${SITE()}/pricing` }, c.userId, false) }) },
};

// Context for a user's first business. Returns null when the user doesn't exist.
export async function ctxFor(userId: string, businessId?: string | null): Promise<Ctx | null> {
  const sql = await db();
  const [u] = (await sql`SELECT id, email, name FROM users WHERE id = ${userId}`) as any[];
  if (!u) return null;
  const rows = (await sql`SELECT b.id, b.name, (SELECT score FROM reports r WHERE r.business_id = b.id ORDER BY created_at DESC LIMIT 1) AS score,
      (SELECT data FROM reports r WHERE r.business_id = b.id ORDER BY created_at DESC LIMIT 1) AS data
    FROM businesses b JOIN memberships m ON m.business_id = b.id
    WHERE m.user_id = ${userId} ORDER BY b.created_at`) as any[];
  const b = rows.find(r => r.id === businessId) ?? rows[0];
  const issues = Array.isArray(b?.data?.checks) ? b.data.checks.filter((c: any) => c.status === "fail").length : 0;
  return { userId, email: u.email, name: u.name, business: b?.name ?? "your business", score: b?.score ?? null, issues, businessId: b?.id ?? null };
}

// Sends a template at most once per user (email_log), skipping marketing for opted-out users.
export async function sendTemplate(userId: string, template: keyof typeof TEMPLATES, opts: { businessId?: string | null; once?: boolean } = {}) {
  if (!dbReady()) return;
  try {
    const t = TEMPLATES[template]; if (!t) return;
    const sql = await db();
    const [u] = (await sql`SELECT email_opt_out FROM users WHERE id = ${userId}`) as any[];
    if (!u || (t.marketing && u.email_opt_out)) return;
    if (opts.once !== false) {
      const claimed = await sql`INSERT INTO email_log (user_id, template) VALUES (${userId}, ${template}) ON CONFLICT DO NOTHING RETURNING user_id`;
      if (!claimed.length) return;
    }
    const release = () => opts.once !== false ? sql`DELETE FROM email_log WHERE user_id = ${userId} AND template = ${template}` : null;
    const c = await ctxFor(userId, opts.businessId); if (!c) return;
    const { subject, html } = t.build(c);
    const r = await sendEmail(c.email, subject, html, { userId, marketing: t.marketing }).catch(async e => { await release(); throw e; });
    if ((r as any)?.skipped) await release();
  } catch (e) { console.error("sendTemplate failed", template, e); }
}
