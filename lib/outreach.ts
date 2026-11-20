// Cold outreach to imported leads: personalized 3-email sequence that drives to the free report.
// Rules: email only (SMS just records consent), unsubscribe in every email, suppression list checked
// before every send, small daily cap to protect the sending domain, sequence stops on any reply/report/customer.
import { createHmac } from "crypto";
import { db } from "./db";
import { sendEmail } from "./email";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://lokly.pro";
const key = () => process.env.EMAIL_SIGNING_SECRET || process.env.CRON_SECRET || "";
export const ptoken = (id: number | string) => createHmac("sha256", key()).update(`prospect:${id}`).digest("base64url").slice(0, 24);
export const goUrl = (id: number) => `${SITE()}/go/${id}.${ptoken(id)}`;
export const optoutUrl = (id: number) => `${SITE()}/api/optout?p=${id}&t=${ptoken(id)}`;
export const DAILY_CAP = () => Number(process.env.OUTREACH_DAILY_CAP ?? 40);
export const postalAddress = () => process.env.BUSINESS_POSTAL_ADDRESS ?? "";

const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const first = (n?: string | null) => n?.trim().split(/\s+/)[0] || "there";

// Steps: 0 = intro, 1 = day 3 follow-up, 2 = day 8 last note. Plain, personal, short.
export const STEPS = [
  { gapDays: 0, build: (p: any) => ({
      subject: `Quick Google check for ${p.business_name}`,
      lines: [`Hi ${esc(first(p.contact_name))},`,
        `I ran into ${esc(p.business_name)}${p.city ? ` while looking at ${esc(p.category ?? "local businesses")} in ${esc(p.city)}` : ""} and wanted to send you something free.`,
        `Lokly checks how you show up on Google: your profile, reviews, photos, website and where you rank against the shops near you. It takes about a minute and you don't need to sign up.`,
        `<a href="${goUrl(p.id)}">See ${esc(p.business_name)}'s free Google report</a>`,
        `If anything looks off, I'm happy to walk you through it. Just reply.`] }) },
  { gapDays: 3, build: (p: any) => ({
      subject: `Re: Quick Google check for ${p.business_name}`,
      lines: [`Hi ${esc(first(p.contact_name))},`,
        `Following up in case this got buried. Most shops we check are missing 3 to 5 easy fixes on Google that cost them calls every week.`,
        `Your free report for ${esc(p.business_name)} is here: <a href="${goUrl(p.id)}">${SITE().replace(/^https?:\/\//, "")}/report</a>`] }) },
  { gapDays: 5, build: (p: any) => ({
      subject: `Last note about ${p.business_name}`,
      lines: [`Hi ${esc(first(p.contact_name))},`,
        `I won't keep emailing. If you ever want to see how ${esc(p.business_name)} stacks up on Google against nearby competitors, the free report is <a href="${goUrl(p.id)}">right here</a>.`,
        `Either way, good luck this season.`] }) },
];

function html(lines: string[], id: number) {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#142133;max-width:560px">
${lines.map(l => `<p style="margin:0 0 14px">${l}</p>`).join("")}
<table cellpadding="0" cellspacing="0" style="margin:6px 0 14px"><tr><td style="padding-right:8px"><img src="${SITE()}/pin-96.png" width="32" height="32" alt="Lokly" style="display:block;border:0"></td><td style="font-size:14px;line-height:1.35">Mark<br><b>Lokly</b> · <a href="${SITE()}" style="color:#142133">lokly.pro</a></td></tr></table>
<p style="font-size:12px;color:#6B7785;margin-top:24px">${esc(postalAddress())}<br>Don't want these emails? <a href="${optoutUrl(id)}" style="color:#6B7785">Unsubscribe</a>.</p></body></html>`;
}

export function preview(p: any, step = 0) { const m = STEPS[step].build(p); return { subject: m.subject, html: html(m.lines, p.id ?? 0) }; }

// Imports rows from CSV text. Needs at least business name + email. Returns counts.
export async function importCsv(text: string, source: string) {
  const rows = parseCsv(text);
  if (!rows.length) return { added: 0, skipped: 0, invalid: 0 };
  const head = rows[0].map(h => h.toLowerCase().trim());
  const col = (...names: string[]) => head.findIndex(h => names.some(n => h === n || h.includes(n)));
  const ix = { name: col("business", "company", "name"), email: col("email"), contact: col("contact", "owner", "first"), phone: col("phone"), web: col("website", "url", "site"), city: col("city"), cat: col("category", "industry", "type"), sms: col("sms_consent", "sms opt", "text consent") };
  if (ix.email < 0) throw new Error("Couldn't find an email column. Add a header row with 'email'.");
  const sql = await db();
  let added = 0, skipped = 0, invalid = 0;
  for (const r of rows.slice(1)) {
    const email = (r[ix.email] ?? "").trim().toLowerCase();
    const name = (ix.name >= 0 && ix.name !== ix.email ? r[ix.name] : "")?.trim() || email.split("@")[1]?.split(".")[0] || "";
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email) || !name) { invalid++; continue; }
    const sms = ix.sms >= 0 && /^(y|yes|true|1)$/i.test((r[ix.sms] ?? "").trim());
    const res = await sql`INSERT INTO prospects (business_name, contact_name, email, phone, website, city, category, source, sms_consent, sms_consent_at)
      VALUES (${name.slice(0, 120)}, ${ix.contact >= 0 ? r[ix.contact]?.trim().slice(0, 80) || null : null}, ${email}, ${ix.phone >= 0 ? r[ix.phone]?.trim().slice(0, 30) || null : null},
        ${ix.web >= 0 ? r[ix.web]?.trim().slice(0, 200) || null : null}, ${ix.city >= 0 ? r[ix.city]?.trim().slice(0, 60) || null : null}, ${ix.cat >= 0 ? r[ix.cat]?.trim().slice(0, 60) || null : null},
        ${source.slice(0, 60)}, ${sms}, ${sms ? new Date().toISOString() : null})
      ON CONFLICT (email) DO NOTHING RETURNING id`;
    res.length ? added++ : skipped++;
  }
  return { added, skipped, invalid };
}

function parseCsv(t: string): string[][] {
  const out: string[][] = []; let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === "," || c === "\t") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cur); if (row.some(x => x.trim())) out.push(row); row = []; cur = ""; }
    else cur += c;
  }
  row.push(cur); if (row.some(x => x.trim())) out.push(row);
  return out;
}

// Puts selected prospects into the sequence (step 0 sends on the next run).
export async function startSequence(ids: number[] | "all-new") {
  const sql = await db();
  return ids === "all-new"
    ? sql`UPDATE prospects SET status = 'queued', next_send_at = now() WHERE status = 'new' RETURNING id`
    : sql`UPDATE prospects SET status = 'queued', next_send_at = now() WHERE id = ANY(${ids}) AND status = 'new' RETURNING id`;
}

// Sends what's due, up to the daily cap. Called by the daily cron.
export async function runOutreach() {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return { skipped: "Resend not configured" };
  if (!postalAddress()) return { skipped: "Set BUSINESS_POSTAL_ADDRESS (required in marketing emails)" };
  const sql = await db();
  const [{ n }] = await sql`SELECT count(*)::int n FROM prospects WHERE last_sent_at > now() - interval '24 hours'` as any[];
  const room = Math.max(0, DAILY_CAP() - n);
  const due = await sql`SELECT p.* FROM prospects p WHERE p.status IN ('queued', 'emailed') AND p.next_send_at <= now() AND p.step < ${STEPS.length}
    AND NOT EXISTS (SELECT 1 FROM suppressions s WHERE s.email = p.email) ORDER BY p.next_send_at LIMIT ${room}` as any[];
  let sent = 0, failed = 0;
  const tpls = await getTemplates().catch(() => STEPS.map(() => null) as Tpl[]);
  for (const p of due) {
    const m = renderEmail(p, p.step, tpls);
    try {
      const j: any = await sendEmail(p.email, m.subject, m.html, {});
      const nextStep = p.step + 1;
      const next = nextStep < STEPS.length ? new Date(Date.now() + STEPS[nextStep].gapDays * 864e5).toISOString() : null;
      await sql`UPDATE prospects SET step = ${nextStep}, status = ${nextStep < STEPS.length ? "emailed" : "finished"}, last_sent_at = now(), next_send_at = ${next}, resend_id = ${j?.id ?? null} WHERE id = ${p.id}`;
      sent++;
    } catch (e) { failed++; await sql`UPDATE prospects SET notes = ${String((e as Error).message).slice(0, 200)} WHERE id = ${p.id}`; }
  }
  return { sent, failed, cap: DAILY_CAP(), remainingToday: room - sent };
}

export async function suppress(email: string, reason: string) {
  const sql = await db();
  await sql`INSERT INTO suppressions (email, reason) VALUES (${email.toLowerCase()}, ${reason}) ON CONFLICT (email) DO NOTHING`;
  await sql`UPDATE prospects SET status = ${reason === "bounced" ? "bounced" : "unsubscribed"}, next_send_at = NULL WHERE email = ${email.toLowerCase()}`;
}

// ---- Custom templates (your own HTML, with merge tags) ----
// Stored in settings 'outreach_templates' as [{subject, html} | null] per step. null = built-in email.
// Merge tags: {{business}} {{first_name}} {{city}} {{category}} {{website}} {{report_link}}
// The legal footer (your address + unsubscribe link) is always added, so a custom email can't drop it.
export type Tpl = { subject: string; html: string } | null;
export const MERGE_TAGS = ["business", "first_name", "city", "category", "website", "report_link"];

export async function getTemplates(): Promise<Tpl[]> {
  const sql = await db();
  const [r] = await sql`SELECT value FROM settings WHERE key = 'outreach_templates'` as any[];
  const v = Array.isArray(r?.value) ? r.value : [];
  return STEPS.map((_, i) => (v[i]?.html ? v[i] : null));
}
export async function saveTemplate(step: number, t: Tpl) {
  const all = await getTemplates();
  all[step] = t && t.html.trim() ? { subject: t.subject.slice(0, 200), html: t.html.slice(0, 50_000) } : null;
  const sql = await db();
  await sql`INSERT INTO settings (key, value) VALUES ('outreach_templates', ${JSON.stringify(all)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
}

function merge(s: string, p: any, html: boolean) {
  const vals: Record<string, string> = {
    business: p.business_name ?? "", first_name: first(p.contact_name), city: p.city ?? "your area",
    category: p.category ?? "local business", website: p.website ?? "", report_link: goUrl(p.id ?? 0),
  };
  return s.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in vals ? (html && k !== "report_link" ? esc(vals[k]) : vals[k]) : m));
}

export function renderEmail(p: any, step: number, tpls: Tpl[]) {
  const t = tpls[step];
  if (!t) return preview(p, step);
  const body = merge(t.html, p, true);
  const foot = `<p style="font-size:12px;color:#6B7785;margin-top:24px;font-family:Arial,sans-serif">${esc(postalAddress())}<br>Don't want these emails? <a href="${optoutUrl(p.id ?? 0)}" style="color:#6B7785">Unsubscribe</a>.</p>`;
  const html = /<\/body>/i.test(body) ? body.replace(/<\/body>/i, `${foot}</body>`) : `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#142133;max-width:560px">${body}${foot}</body></html>`;
  return { subject: merge(t.subject || STEPS[step].build(p).subject, p, false), html };
}

// The built-in email for a step as editable HTML (no footer), to start a custom one from.
export function defaultBody(step: number) {
  const tagged = { id: 0, business_name: "{{business}}", contact_name: "{{first_name}}", city: "{{city}}", category: "{{category}}" };
  const m = STEPS[step].build(tagged);
  const unesc = (s: string) => s.replace(/&#123;|&amp;/g, x => (x === "&amp;" ? "&" : x));
  return { subject: m.subject, html: m.lines.map(l => `<p>${unesc(l).replace(goUrl(0), "{{report_link}}").replace(/Hi \{\{first_name\}\}/, "Hi {{first_name}}")}</p>`).join("\n") };
}

// AI drafts a template from a short brief. Uses Vercel AI Gateway (AI_GATEWAY_API_KEY, or the deployment's OIDC token).
export async function aiDraft(brief: string, step: number, oidc?: string | null): Promise<{ subject: string; html: string }> {
  const token = process.env.AI_GATEWAY_API_KEY || oidc || process.env.VERCEL_OIDC_TOKEN;
  if (!token) throw new Error("AI isn't connected: add AI_GATEWAY_API_KEY in Vercel (Vercel AI Gateway).");
  const stage = ["first cold email", "short follow-up 3 days later", "brief last note"][step] ?? "email";
  const sys = `You write short, plain, human cold emails for Lokly (lokly.pro), a Los Angeles company that manages Google Business Profiles ($25/mo) and builds websites for local shops. Sender: Mark. Goal: get the reader to open their free Google report. Rules: under 110 words, no hype, no emojis, no ALL CAPS, no spammy words (free!!!, guarantee, act now), one link only, written to one owner. Use these merge tags exactly where they fit: {{first_name}}, {{business}}, {{city}}, {{category}}, and the link must be <a href="{{report_link}}">...</a>. Output ONLY JSON: {"subject": "...", "html": "<p>...</p>..."} using simple <p>, <b>, <a> tags. No footer, no unsubscribe line, no signature block beyond "Mark".`;
  const r = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.AI_MODEL || "anthropic/claude-sonnet-4.5", max_tokens: 800,
      messages: [{ role: "system", content: sys }, { role: "user", content: `Write the ${stage}. Brief from Mark: ${brief.slice(0, 1500)}` }] }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`AI error: ${j?.error?.message ?? r.status}`);
  const text: string = j.choices?.[0]?.message?.content ?? "";
  const m = text.match(/\{[\s\S]*\}/);
  const out = m ? JSON.parse(m[0]) : null;
  if (!out?.html) throw new Error("AI returned no email. Try a clearer brief.");
  return { subject: String(out.subject ?? "").slice(0, 200), html: String(out.html).replace(/<script[\s\S]*?<\/script>/gi, "") };
}
