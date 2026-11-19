import { NextResponse } from "next/server";
import { saveLead } from "@/lib/leads";
import { MAILERS } from "@/lib/plans";

// Saves a postcard request. Fulfillment (proof, approval, print via Lob) happens
// after the owner approves; nothing is printed or charged from this endpoint.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const tier = MAILERS.find(m => m.qty === Number(b.qty));
  if (!tier) return NextResponse.json({ error: "Pick a quantity." }, { status: 400 });
  if (!b.businessName || !b.address || !b.email || !b.phone) return NextResponse.json({ error: "Fill in your business, address, email and mobile." }, { status: 400 });
  await saveLead({ kind: "mailer", source: "mailers", businessName: b.businessName, contactName: b.contactName, email: b.email, phone: b.phone, plan: `${tier.qty} postcards $${tier.price}`,
    data: { address: b.address, headline: String(b.headline ?? "").slice(0, 60), detail: String(b.detail ?? "").slice(0, 140), area: b.area, zips: b.zips, qty: tier.qty, price: tier.price, status: "awaiting proof" } });
  return NextResponse.json({ ok: true });
}
