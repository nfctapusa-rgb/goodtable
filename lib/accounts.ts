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

// Services menu in the owner dashboard. No pop-ups or pitches: every option is listed with its
// state, and the owner adds what they want. We do the work; results show in their feed.
import { MARKETING_TOOLS } from "./tools";
export type SvcState = "included" | "active" | "available" | "soon";
export interface Service { id: string; name: string; desc: string; price?: string; cents: number; mode: "payment" | "subscription"; state: SvcState; newPlan?: PlanId; href?: string }
export function servicesFor(b: { plan: string; status?: string; addons?: string[] | null }): Service[] {
  const addons = new Set(b.addons ?? []);
  const pro = b.plan === "pro", site = b.plan === "site" || pro;
  const out: Service[] = [
    { id: "site_member", name: "Website", desc: "Built from your Google profile, hosted, with weekly changes.", price: b.plan === "local" ? "$199 once" : undefined, cents: 19900, mode: "payment", newPlan: "site", state: site ? "included" : b.plan === "local" ? "available" : "available" },
    { id: "pro", name: "Lokly Pro", desc: "Online ordering, live analytics, social posting and email & text campaigns in one plan.", price: "$99/mo", cents: 9900, mode: "subscription", newPlan: "pro", state: pro ? "active" : "available" },
  ];
  for (const t of MARKETING_TOOLS) {
    if (t.id === "reviews") continue;
    const state: SvcState = t.status === "soon" ? "soon" : addons.has(t.id) ? "active" : t.included === "pro" && pro ? "included" : "available";
    out.push({ id: t.id, name: t.name, desc: t.desc, price: t.price, cents: t.cents ?? 0, mode: t.monthly ? "subscription" : "payment", state, href: t.id === "mailers" ? "/mailers" : undefined });
  }
  return out;
}
export const offerById = (b: Parameters<typeof servicesFor>[0], id: string) => servicesFor(b).find(o => o.id === id && o.state === "available");
// kept for older imports
export const offersFor = (b: Parameters<typeof servicesFor>[0], _score?: number | null) => [] as Service[];

// Minimal Stripe REST helper (no SDK).
export async function stripe(path: string, params?: URLSearchParams, method = params ? "POST" : "GET") {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const r = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message ?? "Stripe error");
  return j;
}
