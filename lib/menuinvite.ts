import { db } from "./db";
import { sendEmail } from "./email";
import { html, postalAddress } from "./outreach";

// One-time "free Lokly Menu" invite to restaurant/café/bar prospects. Skips suppressed, unsubscribed, bounced and customers.
const FOOD_RE = String.raw`(restaurant|caf[eé]|coffee|bakery|pizz|taco|grill|diner|\ydeli\y|food|kitchen|sushi|burger|bbq|barbecue|brew|lounge|\ybar\y|pub|ramen|donut|juice|tea house|boba|bistro|eatery|cantina)`;
const _OLD = ["%restaurant%", "%cafe%", "%café%", "%coffee%", "% bar%", "bar%", "%pizza%", "%taco%", "%grill%", "%bakery%", "%food%", "%kitchen%", "%diner%", "%sushi%", "%burger%", "%bbq%", "%deli%", "%brew%", "%tea%", "%lounge%", "%hibachi%", "%ramen%", "%donut%", "%juice%"];
const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export function inviteEmail(p: { id: number; business_name: string; contact_name?: string | null }) {
  const first = (p.contact_name ?? "").split(" ")[0];
  return {
    subject: `Free online menu for ${p.business_name}`,
    html: html([
      `Hi${first ? ` ${esc(first)}` : ""},`,
      `We just launched <b>Lokly Menu</b>: a free online menu for local restaurants, cafés and bars. ${esc(p.business_name)} could have one live in about 5 minutes.`,
      `You get a menu page with your logo and banner, prices, and specials or events at the top. It also has Call, Directions and Order buttons, plus a QR code for tables and windows. Update prices anytime from your phone.`,
      `Here's what it looks like: <a href="https://lokly.pro/m/lokly-demo-cafe-los-angeles?src=invite">demo menu</a>.`,
      `<a href="https://lokly.pro/menu?src=invite" style="display:inline-block;background:#142133;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Create my free menu</a>`,
      `It's free, with no app and no fees.`,
    ], p.id),
  };
}

export async function inviteStats() {
  const sql = await db();
  const [r] = await sql`SELECT count(*) FILTER (WHERE menu_invited_at IS NULL) AS pending, count(*) FILTER (WHERE menu_invited_at IS NOT NULL) AS sent
    FROM prospects p WHERE coalesce(category,'') ~* ${FOOD_RE} AND coalesce(category,'') !~* 'barber'
    AND status NOT IN ('unsubscribed','bounced','customer') AND NOT EXISTS (SELECT 1 FROM suppressions s WHERE s.email = p.email)` as any[];
  const sample = await sql`SELECT id, business_name, category, email FROM prospects p WHERE menu_invited_at IS NULL AND coalesce(category,'') ~* ${FOOD_RE} AND coalesce(category,'') !~* 'barber'
    AND status NOT IN ('unsubscribed','bounced','customer') AND NOT EXISTS (SELECT 1 FROM suppressions s WHERE s.email = p.email) ORDER BY id LIMIT 300` as any[];
  return { pending: Number(r.pending), sent: Number(r.sent), list: sample };
}

export async function sendInvites(limit: number) {
  if (!postalAddress()) return { error: "BUSINESS_POSTAL_ADDRESS missing" };
  const sql = await db();
  const { list } = await inviteStats();
  let sent = 0, failed = 0;
  for (const p of list.slice(0, Math.max(0, Math.min(limit, 100)))) {
    const m = inviteEmail(p);
    try { await sendEmail(p.email, m.subject, m.html, {}); await sql`UPDATE prospects SET menu_invited_at = now() WHERE id = ${p.id}`; sent++; }
    catch { failed++; }
  }
  return { sent, failed };
}
