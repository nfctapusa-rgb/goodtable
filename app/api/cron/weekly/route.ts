import { NextResponse } from "next/server";
import { runWeekly } from "@/lib/autopilot";
import { runHouseWeekly } from "@/lib/house";

// Vercel Cron, Mondays. Also callable by admin with ?key=ADMIN_KEY to run now.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ok = (process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`) || (process.env.ADMIN_KEY && u.searchParams.get("key") === process.env.ADMIN_KEY);
  if (!ok) return new NextResponse("Unauthorized", { status: 401 });
  const clients = await runWeekly();
  const house = await runHouseWeekly().catch(e => ({ error: (e as Error).message }));
  return NextResponse.json({ ...clients, house });
}
