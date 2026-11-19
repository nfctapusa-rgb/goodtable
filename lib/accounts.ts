// Client account lifecycle: signup -> pending -> active/trial -> past_due/canceled.
// Payment state is set by the Stripe webhook; when Stripe isn't connected, the admin activates by hand.
import { db } from "./db";
import { planById, type PlanId } from "./plans";

export type Status = "pending" | "active" | "trial" | "past_due" | "canceled";

// Onboarding checklist per plan. who: "owner" = the client does it, "team" = Lokly does it.
const BASE = [
  { key: "google", title: "Connect your Google Business Profile", who: "owner" },
  { key: "assets", title: "Send your logo and 5+ photos (text them to us)", who: "owner" },
  { key: "optimize", title: "We optimize your Google profile", who: "team" },
  { key: "nfc", title: "We mail your free NFC review card", who: "team" },
  { key: "posts", title: "First weekly post and offer goes live", who: "team" },
  { key: "report", title: "Your first monthly report", who: "team" },
];
const SITE = [
  { key: "site_draft", title: "We build your website draft", who: "team" },
  { key: "site_approve", title: "Approve your website", who: "owner" },
  { key: "site_live", title: "Website goes live on your domain", who: "team" },
];
const PRO = [
  { key: "ordering", title: "Send your ordering or booking link", who: "owner" },
  { key: "tools", title: "Pick your marketing tools", who: "owner" },
  { key: "social", title: "Add Lokly as a partner on your Facebook & Instagram", who: "owner" },
];
export function tasksFor(plan: string) {
  const list = [...BASE, ...(plan === "site" || plan === "pro" ? SITE : []), ...(plan === "pro" ? PRO : [])];
  return list.map((t, i) => ({ ...t, sort: i }));
}

export async function seedTasks(businessId: string, plan: string, opts: { hasPlace?: boolean } = {}) {
  const sql = await db();
  for (const t of tasksFor(plan)) {
    const done = t.key === "google" && !!opts.hasPlace;
    await sql`INSERT INTO tasks (business_id, key, title, who, sort, done, done_at)
      VALUES (${businessId}, ${t.key}, ${t.title}, ${t.who}, ${t.sort}, ${done}, ${done ? new Date().toISOString() : null})
      ON CONFLICT (business_id, key) DO NOTHING`;
  }
}

export async function setPlan(businessId: string, plan: PlanId, status: Status, extra: { sub?: string | null; customer?: string | null; trialEnds?: string | null } = {}) {
  const sql = await db();
  await sql`UPDATE businesses SET plan = ${plan}, status = ${status},
    stripe_subscription_id = COALESCE(${extra.sub ?? null}, stripe_subscription_id),
    stripe_customer_id = COALESCE(${extra.customer ?? null}, stripe_customer_id),
    trial_ends_at = COALESCE(${extra.trialEnds ?? null}, trial_ends_at)
    WHERE id = ${businessId}`;
  await seedTasks(businessId, plan);
  await sql`INSERT INTO audit_log (business_id, action, meta) VALUES (${businessId}, 'plan.set', ${JSON.stringify({ plan, status })})`;
}

// Upsells: what to offer next, based on plan and status. Prices in cents.
export interface Offer { id: string; title: string; body: string; cta: string; price: string; cents: number; mode: "payment" | "subscription"; newPlan?: PlanId }
export function offersFor(b: { plan: string; status: string; website?: string | null; trial_ends_at?: string | null }, score?: number | null): Offer[] {
  const out: Offer[] = [];
  if (b.plan === "local") out.push({ id: "site_member", title: "Add a website for $199", body: `Members save $100 on the website package.${score != null && score < 70 ? ` Your report score is ${score}/100, and a new site fixes most of the website issues.` : " Built from your Google profile, with hosting and weekly changes included in your $25."}`, cta: "Add my website", price: "$199 once", cents: 19900, mode: "payment", newPlan: "site" });
  if (b.plan === "local" || b.plan === "site") out.push({ id: "pro", title: "Upgrade to Lokly Pro", body: b.plan === "site" && b.trial_ends_at ? `Your free months end ${new Date(b.trial_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}. Pro adds online ordering, a live analytics dashboard, social posting and email & text campaigns.` : "Online ordering, a live analytics dashboard, social posting and email & text campaigns.", cta: "Upgrade to Pro", price: "$89 a month", cents: 8900, mode: "subscription", newPlan: "pro" });
  if (b.plan === "pro") out.push({ id: "mailers", title: "Send postcards to your neighborhood", body: "250 homes near your shop for $199, with a tracked QR code.", cta: "Design a postcard", price: "from $199", cents: 0, mode: "payment" });
  out.push({ id: "ads", title: "Lokly Ads", body: "We run your Instagram, Facebook and Google ads and report results monthly.", cta: "Add Lokly Ads", price: "$149 a month + ad spend", cents: 14900, mode: "subscription" });
  return out;
}
export const offerById = (b: Parameters<typeof offersFor>[0], id: string) => offersFor(b).find(o => o.id === id);

// Minimal Stripe REST helper (no SDK).
export async function stripe(path: string, params?: URLSearchParams, method = params ? "POST" : "GET") {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const r = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message ?? "Stripe error");
  return j;
}
