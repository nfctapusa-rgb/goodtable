// Shopify handles one-time purchases (NFC cards, postcard packs). Lokly sends buyers to a
// Shopify cart link tagged with their business; the orders/paid webhook switches the service on.
// Plans can also be paid through Shopify (PAYMENTS_PROVIDER=shopify) using the Shopify Subscriptions app:
//   SHOPIFY_VARIANTS keys plan_local, plan_pro, plan_site (one-time $299 setup)
//   SHOPIFY_SELLING_PLANS = {"plan_local":"<selling plan id>","plan_pro":"<id>"}
// Env: SHOPIFY_STORE_DOMAIN (xxx.myshopify.com), SHOPIFY_WEBHOOK_SECRET,
//      SHOPIFY_VARIANTS = {"nfc":"123","mailer_250":"456","mailer_500":"789","mailer_1000":"012"}
export const shopifyReady = () => !!process.env.SHOPIFY_STORE_DOMAIN && !!process.env.SHOPIFY_VARIANTS;

export function variants(): Record<string, string> {
  try { return JSON.parse(process.env.SHOPIFY_VARIANTS ?? "{}"); } catch { return {}; }
}

export function buyUrl(item: string, qty: number, ctx: { businessId?: string; email?: string; ref?: string }) {
  const v = variants()[item];
  if (!shopifyReady() || !v) return null;
  const u = new URL(`https://${process.env.SHOPIFY_STORE_DOMAIN}/cart/${v}:${Math.max(1, Math.min(qty, 50))}`);
  if (ctx.email) u.searchParams.set("checkout[email]", ctx.email);
  if (ctx.businessId) u.searchParams.set("attributes[lokly_business]", ctx.businessId);
  if (ctx.ref) u.searchParams.set("attributes[lokly_ref]", ctx.ref);
  u.searchParams.set("ref", "lokly");
  return u.toString();
}

export const itemForVariant = (id: string | number) => Object.entries(variants()).find(([, v]) => String(v) === String(id))?.[0];

export const shopifyPlans = () => process.env.PAYMENTS_PROVIDER === "shopify" && shopifyReady();
function sellingPlans(): Record<string, string> { try { return JSON.parse(process.env.SHOPIFY_SELLING_PLANS ?? "{}"); } catch { return {}; } }

// Online-store cart link that adds the plan (with its monthly selling plan) and jumps to checkout.
// The business id rides along as a hidden line-item property so the order webhook can activate it.
export function planCheckoutUrl(plan: string, ctx: { businessId: string; email?: string }) {
  const key = `plan_${plan}`;
  const v = variants()[key];
  if (!v) return null;
  const u = new URL(`https://${process.env.SHOPIFY_STORE_DOMAIN}/cart/add`);
  u.searchParams.set("id", v);
  u.searchParams.set("quantity", "1");
  const sp = sellingPlans()[key];
  if (sp) u.searchParams.set("selling_plan", sp);
  u.searchParams.set("properties[_lokly_business]", ctx.businessId);
  u.searchParams.set("return_to", ctx.email ? `/checkout?checkout[email]=${encodeURIComponent(ctx.email)}` : "/checkout");
  return u.toString();
}
