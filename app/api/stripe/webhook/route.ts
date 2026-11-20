import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { setPlan, stripe } from "@/lib/accounts";
import type { PlanId } from "@/lib/plans";
import { track, userSource } from "@/lib/track";
import { sendTemplate } from "@/lib/email";

async function ownerOf(sql: any, bizId: string) {
  const [m] = await sql`SELECT user_id FROM memberships WHERE business_id = ${bizId} AND role = 'owner' LIMIT 1`;
  return (m?.user_id as string) ?? null;
}
async function bizBySub(sql: any, subId: string) {
  const [b] = await sql`SELECT id FROM businesses WHERE stripe_subscription_id = ${subId}`;
  return (b?.id as string) ?? null;
}

// Stripe -> Lokly. Set STRIPE_WEBHOOK_SECRET and point a Stripe webhook at /api/stripe/webhook with:
// checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed, invoice.paid
function verify(raw: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map(p => p.split("=") as [string, string]));
  const t = parts.t, v1 = header.split(",").filter(p => p.startsWith("v1=")).map(p => p.slice(3));
  if (!t || !v1.length || Math.abs(Date.now() / 1000 - Number(t)) > 600) return false;
  const exp = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  return v1.some(sig => sig.length === exp.length && timingSafeEqual(Buffer.from(sig), Buffer.from(exp)));
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret || !verify(raw, req.headers.get("stripe-signature"), secret)) return new NextResponse("Bad signature", { status: 400 });
  const ev = JSON.parse(raw);
  const sql = await db();
  const seen = await sql`INSERT INTO billing_events (id, type) VALUES (${ev.id}, ${ev.type}) ON CONFLICT DO NOTHING RETURNING id`;
  if (!seen.length) return NextResponse.json({ ok: true, duplicate: true });
  const o = ev.data.object;

  if (ev.type === "checkout.session.completed") {
    const bizId = o.metadata?.business_id ?? o.client_reference_id;
    if (!bizId) return NextResponse.json({ ok: true });
    const [b] = await sql`SELECT plan, stripe_subscription_id FROM businesses WHERE id = ${bizId}` as any[];
    if (!b) return NextResponse.json({ ok: true });
    const newPlan = (o.metadata?.new_plan || o.metadata?.plan) as PlanId | undefined;
    let trialEnds: string | null = null, status: "active" | "trial" = "active";
    if (o.subscription) {
      const sub = await stripe(`subscriptions/${o.subscription}`);
      if (sub?.trial_end) { trialEnds = new Date(sub.trial_end * 1000).toISOString(); status = "trial"; }
    }
    if (o.metadata?.kind === "upsell") {
      // Upgrade to Pro replaces the old subscription so the client isn't billed twice.
      if (newPlan === "pro" && b.stripe_subscription_id && o.subscription && b.stripe_subscription_id !== o.subscription)
        await stripe(`subscriptions/${b.stripe_subscription_id}`, undefined, "DELETE").catch(() => null);
      if (newPlan) await setPlan(bizId, newPlan, "active", { sub: newPlan === "pro" ? o.subscription : null, customer: o.customer });
      else {
        await sql`UPDATE businesses SET addons = (SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements(addons || ${JSON.stringify([o.metadata?.offer])}::jsonb) x) WHERE id = ${bizId}`;
        await sql`INSERT INTO audit_log (business_id, action, meta) VALUES (${bizId}, 'addon.purchased', ${JSON.stringify({ offer: o.metadata?.offer })})`;
      }
    } else {
      await setPlan(bizId, (newPlan ?? b.plan) as PlanId, status, { sub: o.subscription, customer: o.customer, trialEnds });
    }
    const owner = await ownerOf(sql, bizId);
    await track(o.metadata?.kind === "upsell" ? "upgrade" : "paid", { attr: owner ? await userSource(owner) : {}, userId: owner, businessId: bizId, meta: { plan: newPlan ?? b.plan, amount: o.amount_total ?? null } });
  }
  if (ev.type === "customer.subscription.updated" || ev.type === "customer.subscription.deleted") {
    const map: Record<string, string> = { active: "active", trialing: "trial", past_due: "past_due", unpaid: "past_due", canceled: "canceled", incomplete_expired: "canceled" };
    const st = ev.type.endsWith("deleted") ? "canceled" : map[o.status];
    if (st) await sql`UPDATE businesses SET status = ${st} WHERE stripe_subscription_id = ${o.id}`;
    if (st === "canceled") {
      const bizId = await bizBySub(sql, o.id), owner = bizId ? await ownerOf(sql, bizId) : null;
      if (bizId) await track("canceled", { attr: owner ? await userSource(owner) : {}, userId: owner, businessId: bizId });
      if (owner) await sendTemplate(owner, "canceled", { businessId: bizId, once: false });
    }
  }
  if (ev.type === "invoice.payment_failed" && o.subscription) {
    await sql`UPDATE businesses SET status = 'past_due' WHERE stripe_subscription_id = ${o.subscription}`;
    const bizId = await bizBySub(sql, o.subscription), owner = bizId ? await ownerOf(sql, bizId) : null;
    if (bizId) await track("payment_failed", { attr: owner ? await userSource(owner) : {}, userId: owner, businessId: bizId });
    if (owner) await sendTemplate(owner, "payment_failed", { businessId: bizId, once: false });
  }
  // Revenue ledger for the Growth Center. Covers first payments, renewals and one-time charges.
  if (ev.type === "invoice.paid" && o.amount_paid > 0) {
    const bizId = (o.subscription ? await bizBySub(sql, o.subscription) : null) ?? o.subscription_details?.metadata?.business_id ?? o.metadata?.business_id ?? null;
    await sql`INSERT INTO payments (id, business_id, amount_cents, currency, paid_at) VALUES (${o.id}, ${bizId}, ${o.amount_paid}, ${o.currency ?? "usd"}, to_timestamp(${o.status_transitions?.paid_at ?? Math.floor(Date.now() / 1000)})) ON CONFLICT DO NOTHING`;
  }
  if (ev.type === "checkout.session.completed" && o.mode === "payment" && o.payment_status === "paid" && o.amount_total > 0) {
    await sql`INSERT INTO payments (id, business_id, amount_cents, currency) VALUES (${o.id}, ${o.metadata?.business_id ?? o.client_reference_id ?? null}, ${o.amount_total}, ${o.currency ?? "usd"}) ON CONFLICT DO NOTHING`;
  }
  return NextResponse.json({ ok: true });
}
