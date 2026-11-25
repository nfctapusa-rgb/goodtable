import { NextResponse } from "next/server";
import { runProspector, queueProspected } from "@/lib/prospector";

export const runtime = "nodejs";
export const maxDuration = 300;

// Weekdays before the outreach send: find new weak-profile businesses and add them to the list.
// Preview deployments can run it without a key (for checking a batch); production needs the cron secret or admin key.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ok = (process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`)
    || (process.env.ADMIN_KEY && u.searchParams.get("key") === process.env.ADMIN_KEY)
    || process.env.VERCEL_ENV === "preview";
  if (!ok) return new NextResponse("Unauthorized", { status: 401 });
  if (u.searchParams.get("queue") === "1" && process.env.VERCEL_ENV !== "preview") return NextResponse.json({ queued: (await queueProspected()).length });
  const n = Math.min(Math.max(Number(u.searchParams.get("n") ?? process.env.PROSPECTOR_QUERIES ?? 3), 1), 6);
  return NextResponse.json(await runProspector(n));
}
