import { NextResponse } from "next/server";
import { planById, SITE_FREE_MONTHS, SITE_MONTHLY_CENTS } from "@/lib/plans";
import { saveLead } from "@/lib/leads";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const plan = planById(String(body.plan ?? "local"));
  if (!plan) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  await saveLead({ kind: "onboarding", source: body.src ?? "web", businessName: body.businessName, website: body.website, placeId: body.placeId, contactName: body.contactName, email: body.email, phone: body.phone, plan: plan.id, data: { shipTo: body.shipTo, nfcCard: "to ship", googleProfile: body.googleProfile, orderLink: body.orderLink, instagram: body.instagram, notes: body.notes, tools: body.tools ? String(body.tools).split(",").slice(0, 10) : undefined } });
  const key = process.env.STRIPE_SECRET_KEY;
  // Until online payments are connected, the signup is saved and we follow up personally.
  if (!key) return NextResponse.json({ ok: true, manual: true });
  const origin = new URL(req.url).origin;
  const f = new URLSearchParams();
  const recurring = plan.interval === "month" || plan.id === "site";
  f.set("mode", recurring ? "subscription" : "payment");
  f.set("success_url", `${origin}/grader?welcome=1&plan=${plan.id}&session_id={CHECKOUT_SESSION_ID}`);
  f.set("cancel_url", `${origin}/pricing?canceled=1`);
  f.set("allow_promotion_codes", "true");
  f.set("line_items[0][quantity]", "1");
  const envPrice = process.env[`STRIPE_PRICE_${plan.id.toUpperCase()}`];
  if (envPrice) f.set("line_items[0][price]", envPrice);
  else {
    f.set("line_items[0][price_data][currency]", "usd");
    f.set("line_items[0][price_data][unit_amount]", String(plan.cents));
    if (recurring) f.set("line_items[0][price_data][recurring][interval]", "month");
    f.set("line_items[0][price_data][product_data][name]", plan.name);
  }
  if (plan.id === "site" && !envPrice) {
    // Website Package: $299 build today, then management + hosting at $25/mo after the free months.
    f.set("line_items[0][price_data][product_data][name]", "Website build + Google profile optimization");
    f.delete("line_items[0][price_data][recurring][interval]");
    f.set("line_items[1][quantity]", "1");
    f.set("line_items[1][price_data][currency]", "usd");
    f.set("line_items[1][price_data][unit_amount]", String(SITE_MONTHLY_CENTS));
    f.set("line_items[1][price_data][recurring][interval]", "month");
    f.set("line_items[1][price_data][product_data][name]", "Google management + hosting");
    f.set("subscription_data[trial_period_days]", String(SITE_FREE_MONTHS * 30));
  }
  f.set("phone_number_collection[enabled]", "true");
  if (body.email) f.set("customer_email", String(body.email).slice(0, 200));
  f.set("metadata[plan]", plan.id);
  for (const k of ["businessName", "contactName", "phone", "website", "googleProfile", "orderLink", "instagram", "notes", "placeId", "score"]) if (body[k] != null) f.set(`metadata[${k}]`, String(body[k]).slice(0, 400));
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" }, body: f,
  });
  const j = await r.json();
  if (!r.ok) return NextResponse.json({ error: j.error?.message ?? "Stripe error" }, { status: 502 });
  return NextResponse.json({ url: j.url });
}
