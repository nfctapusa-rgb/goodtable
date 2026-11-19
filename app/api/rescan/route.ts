import { NextResponse } from "next/server";
import { db, reportScore } from "@/lib/db";
import { currentUser, businessFor } from "@/lib/auth";

export const maxDuration = 30;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { businessId } = await req.json().catch(() => ({}));
  const biz = await businessFor(user.id, String(businessId ?? ""));
  if (!biz) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const res = await fetch(new URL("/api/grade", req.url), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placeId: biz.place_id, url: biz.website, businessName: biz.name, city: biz.city, keyword: biz.category }),
  });
  const report = await res.json();
  if (!res.ok) return NextResponse.json({ error: report.error ?? "Scan failed." }, { status: 502 });
  const sql = await db();
  await sql`INSERT INTO reports (business_id, score, data) VALUES (${biz.id}, ${reportScore(report)}, ${JSON.stringify(report)})`;
  await sql`INSERT INTO audit_log (business_id, user_id, action) VALUES (${biz.id}, ${user.id}, 'report.rescan')`;
  return NextResponse.json({ ok: true, score: reportScore(report) });
}
