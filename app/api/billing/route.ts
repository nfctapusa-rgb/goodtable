import { NextResponse } from "next/server";
import { currentUser, businessFor } from "@/lib/auth";
import { stripe } from "@/lib/accounts";

// Opens the Stripe customer portal (update card, invoices, cancel).
export async function POST(req: Request) {
  const f = await req.formData();
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const bizId = String(f.get("b") ?? "");
  const biz: any = await businessFor(user.id, bizId);
  if (!biz?.stripe_customer_id) return NextResponse.redirect(new URL(`/dashboard?b=${bizId}&billing=none`, req.url), 303);
  const p = new URLSearchParams({ customer: biz.stripe_customer_id, return_url: `${new URL(req.url).origin}/dashboard?b=${bizId}` });
  const j = await stripe("billing_portal/sessions", p);
  return NextResponse.redirect(j.url, 303);
}
