import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { dbReady } from "@/lib/db";

// Lets client pages know whether the visitor is logged in (no personal data returned).
export async function GET() {
  const u = dbReady() ? await currentUser().catch(() => null) : null;
  return NextResponse.json({ loggedIn: !!u }, { headers: { "Cache-Control": "no-store" } });
}
