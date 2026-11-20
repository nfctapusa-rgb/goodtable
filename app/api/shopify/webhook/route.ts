import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { itemForVariant } from "@/lib/shopify";
import { setPlan } from "@/lib/accounts";

// Shopify orders/paid -> mark the purchase on the client's account and show it in their results feed.
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const sig = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const exp = secret ? createHmac("sha256", secret).update(raw, "utf8").digest("base64") : "";
  if (!secret || sig.length !== exp.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return new NextResponse("Bad signature", { status: 401 });
  const o = JSON.parse(raw);
  const sql = await db();
  const evId = `shopify_${req.headers.get("x-shopify-webhook-id") ?? o.id}`;
  const fresh = await sql`INSERT INTO billing_events (id, type) VALUES (${evId}, ${req.headers.get("x-shopify-topic") ?? "orders/paid"}) ON CONFLICT DO NOTHING RETURNING id`;
  if (!fresh.length) return NextResponse.json({ ok: true, duplicate: true });

  const attrs = Object.fromEntries((o.note_attributes ?? []).map((a: any) => [a.name, a.value]));
  let bizId: string | null = attrs.lokly_business ?? null;
  if (!bizId && o.email) {
    const [b] = await sql`SELECT m.business_id FROM users u JOIN memberships m ON m.user_id = u.id WHERE u.email = ${String(o.email).toLowerCase()} ORDER BY m.business_id LIMIT 1` as any[];
    bizId = b?.business_id ?? null;
  }
  for (const li of o.line_items ?? []) {
    const item = itemForVariant(li.variant_id);
    if (!item) continue;
    if (item.startsWith("plan_")) {
      const plan = item.slice(5) as any;
      const fromProp = (li.properties ?? []).find((p: any) => p.name === "_lokly_business")?.value;
      const target = fromProp ?? bizId;
      if (target) {
        await setPlan(target, plan, plan === "site" ? "trial" : "active", { customer: `shopify:${o.customer?.id ?? ""}`, trialEnds: plan === "site" ? new Date(Date.now() + 90 * 864e5).toISOString() : null });
        await sql`INSERT INTO payments (id, business_id, amount_cents) VALUES (${`shopify_${o.id}_${li.id}`}, ${target}, ${Math.round(Number(li.price) * 100)}) ON CONFLICT DO NOTHING`.catch(() => null);
      }
      continue;
    }
    const label = item === "nfc" ? `${li.quantity} NFC review card${li.quantity > 1 ? "s" : ""} ordered` : item.startsWith("mailer_") ? `Postcards to ${item.split("_")[1]} homes paid` : `${li.title} paid`;
    if (bizId) await sql`INSERT INTO results (business_id, kind, title, detail) VALUES (${bizId}, ${item.startsWith("mailer") ? "Postcard" : "Order"}, ${label}, ${`Shopify order ${o.name ?? o.id}. We'll text you when it ships.`})`;
    if (attrs.lokly_ref && item.startsWith("mailer_")) await sql`UPDATE leads SET data = data || ${JSON.stringify({ status: "paid", shopifyOrder: o.name ?? String(o.id) })}::jsonb WHERE id = ${Number(attrs.lokly_ref)} AND kind = 'mailer'`;
    await sql`INSERT INTO leads (kind, source, business_name, email, plan, data) VALUES ('tool', 'shopify', ${o.customer?.default_address?.company ?? o.billing_address?.company ?? null}, ${o.email ?? null}, ${item}, ${JSON.stringify({ tool: item, toolName: label, businessId: bizId, order: o.name ?? o.id, total: o.total_price, shipTo: o.shipping_address ? [o.shipping_address.address1, o.shipping_address.city, o.shipping_address.province_code, o.shipping_address.zip].filter(Boolean).join(", ") : null })})`;
  }
  return NextResponse.json({ ok: true });
}
