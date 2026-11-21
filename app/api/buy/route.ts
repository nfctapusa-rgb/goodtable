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
      attrs = { "Restaurant": m.name, "Program cards to": link, "Tables": String(qty) };
      note = `Program ${qty} NFC menu cards to ${link} (${m.name})`;
      email = email ?? m.email ?? undefined;
    }
  }
  const url = buyUrl(u.searchParams.get("item") ?? "", qty, { businessId: u.searchParams.get("b") ?? undefined, email, ref: u.searchParams.get("ref") ?? undefined, attrs, note });
  return NextResponse.redirect(url ?? new URL("/pricing#addons", req.url), 303);
}
