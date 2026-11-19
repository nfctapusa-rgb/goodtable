import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Payments aren't connected yet. Add STRIPE_SECRET_KEY in Vercel." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const origin = new URL(req.url).origin;
  const f = new URLSearchParams();
  f.set("mode", "subscription");
  f.set("success_url", `${origin}/?welcome=1&session_id={CHECKOUT_SESSION_ID}`);
  f.set("cancel_url", `${origin}/?canceled=1`);
  f.set("allow_promotion_codes", "true");
  f.set("line_items[0][quantity]", "1");
  if (process.env.STRIPE_PRICE_ID) f.set("line_items[0][price]", process.env.STRIPE_PRICE_ID);
  else {
    f.set("line_items[0][price_data][currency]", "usd");
    f.set("line_items[0][price_data][unit_amount]", "4999");
    f.set("line_items[0][price_data][recurring][interval]", "month");
    f.set("line_items[0][price_data][product_data][name]", "GoodTable Growth — all tools");
  }
  if (body.email) f.set("customer_email", String(body.email).slice(0, 200));
  for (const k of ["businessName", "website", "placeId", "score"]) if (body[k] != null) f.set(`metadata[${k}]`, String(body[k]).slice(0, 400));
  f.set("subscription_data[metadata][businessName]", String(body.businessName ?? "").slice(0, 400));

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" }, body: f,
  });
  const j = await r.json();
  if (!r.ok) return NextResponse.json({ error: j.error?.message ?? "Stripe error" }, { status: 502 });
  return NextResponse.json({ url: j.url });
}
