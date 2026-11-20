import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, businessFor } from "@/lib/auth";
import { saveLead } from "@/lib/leads";

// Owner taps "I sent the invite". We mark their step done and put it in admin so the team
// accepts the invite in Google and adds the profile to LeadSnap.
export async function POST(req: Request) {
  const f = await req.formData();
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const bizId = String(f.get("b") ?? "");
  const biz: any = await businessFor(user.id, bizId);
  if (!biz) return new NextResponse("Not found", { status: 404 });
  const sql = await db();
  await sql`UPDATE tasks SET done = true, done_at = now() WHERE business_id = ${bizId} AND key = 'google'`;
  await saveLead({ kind: "tool", source: "dashboard", businessName: biz.name, email: user.email, plan: biz.plan, data: { tool: "gbp-invite", toolName: "Google manager invite sent: accept it, then add to LeadSnap", businessId: bizId, placeId: biz.place_id } });
  return NextResponse.redirect(new URL(`/dashboard?b=${bizId}&invited=1#google`, req.url), 303);
}
