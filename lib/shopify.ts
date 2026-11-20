// Shopify handles one-time purchases (NFC cards, postcard packs). Lokly sends buyers to a
// Shopify cart link tagged with their business; the orders/paid webhook switches the service on.
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
