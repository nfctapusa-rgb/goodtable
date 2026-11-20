import { NextResponse } from "next/server";
import { currentUser, businessFor } from "@/lib/auth";
import { offerById, stripe } from "@/lib/accounts";
import { saveLead } from "@/lib/leads";

// One-click upsell from the welcome page or dashboard.
export async function POST(req: Request) {
  const f = await req.formData();
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const bizId = String(f.get("b") ?? "");
  const biz: any = await businessFor(user.id, bizId);
  if (!biz) return new NextResponse("Not found", { status: 404 });
  const offer = offerById(biz, String(f.get("offer") ?? ""));
  if (!offer) return new NextResponse("Offer not available", { status: 400 });
  if (offer.href) return NextResponse.redirect(new URL(offer.href, req.url), 303);
  const origin = new URL(req.url).origin;
  if (!process.env.STRIPE_SECRET_KEY || !offer.cents) {
    await saveLead({ kind: "tool", source: "upsell", businessName: biz.name, email: user.email, plan: biz.plan, data: { tool: offer.id, toolName: offer.name, businessId: bizId, price: offer.price } });
    return NextResponse.redirect(new URL(`/dashboard?b=${bizId}&requested=${offer.id}#services`, req.url), 303);
  }
  const p = new URLSearchParams();
  p.set("mode", offer.mode);
  p.set("client_reference_id", bizId);
  p.set("success_url", `${origin}/dashboard?b=${bizId}&upgraded=${offer.id}`);
  p.set("cancel_url", `${origin}/dashboard?b=${bizId}`);
  if (biz.stripe_customer_id) p.set("customer", biz.stripe_customer_id); else p.set("customer_email", user.email);
  for (const [k, v] of Object.entries({ business_id: bizId, kind: "upsell", offer: offer.id, new_plan: offer.newPlan ?? "" })) p.set(`metadata[${k}]`, v);
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", "usd");
  p.set("line_items[0][price_data][unit_amount]", String(offer.cents));
  p.set("line_items[0][price_data][product_data][name]", offer.name);
  if (offer.mode === "subscription") p.set("line_items[0][price_data][recurring][interval]", "month");
  const j = await stripe("checkout/sessions", p);
  return NextResponse.redirect(j.url, 303);
}
