import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { buyUrl } from "@/lib/shopify";
import { db, dbReady } from "@/lib/db";

// /api/buy?item=nfc&qty=3&b=<businessId>&ref=<leadId> -> Shopify checkout for one-time items.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const user = await currentUser().catch(() => null);
  const qty = Number(u.searchParams.get("qty") ?? 1);
  // NFC menu cards: ?menu=<slug> -> we program every card to that restaurant's live menu.
  let attrs: Record<string, string> | undefined, note: string | undefined, email = user?.email;
  const slug = u.searchParams.get("menu");
  if (slug && dbReady()) {
    const sql = await db();
    const [m] = await sql`SELECT slug, name, email FROM menus WHERE slug = ${slug}` as any[];
    if (m) {
      const link = `https://lokly.pro/m/${m.slug}`;
      attrs = { "Restaurant": m.name, "Program cards to": `${link}?t=<table #>&src=nfc`, "Tables": String(qty), ...(qty >= 20 ? { "Deal": "20+ cards: 1 free month Google Management" } : {}) };
      note = `Program ${qty} NFC menu cards for ${m.name}. Card N -> ${link}?t=N&src=nfc (N = 1 to ${qty}), label each card Table N.${qty >= 20 ? " Deal: 1 free month of Google Management." : ""}`;
      email = email ?? m.email ?? undefined;
    }
  }
  const url = buyUrl(u.searchParams.get("item") ?? "", qty, { businessId: u.searchParams.get("b") ?? undefined, email, ref: u.searchParams.get("ref") ?? undefined, attrs, note });
  return NextResponse.redirect(url ?? new URL("/pricing#addons", req.url), 303);
}
