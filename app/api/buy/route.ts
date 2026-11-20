import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { buyUrl } from "@/lib/shopify";

// /api/buy?item=nfc&qty=3&b=<businessId>&ref=<leadId> -> Shopify checkout for one-time items.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const user = await currentUser().catch(() => null);
  const url = buyUrl(u.searchParams.get("item") ?? "", Number(u.searchParams.get("qty") ?? 1), { businessId: u.searchParams.get("b") ?? undefined, email: user?.email, ref: u.searchParams.get("ref") ?? undefined });
  return NextResponse.redirect(url ?? new URL("/pricing#addons", req.url), 303);
}
