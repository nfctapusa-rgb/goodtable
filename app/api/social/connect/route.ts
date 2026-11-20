import { NextResponse } from "next/server";
import { currentUser, businessFor } from "@/lib/auth";
import { ayrshareReady, profileKeyFor, connectUrl } from "@/lib/ayrshare";
import { saveLead } from "@/lib/leads";

// Owner taps "Connect Instagram, Facebook & TikTok". Without Ayrshare we fall back to Meta partner steps.
export async function POST(req: Request) {
  const f = await req.formData();
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const bizId = String(f.get("b") ?? "");
  const biz: any = await businessFor(user.id, bizId);
  if (!biz) return new NextResponse("Not found", { status: 404 });
  const back = `${new URL(req.url).origin}/dashboard?b=${bizId}&social=linked#social`;
  if (!ayrshareReady()) {
    await saveLead({ kind: "tool", source: "dashboard", businessName: biz.name, email: user.email, plan: biz.plan, data: { tool: "social-connect", toolName: "Connect socials", businessId: bizId } });
    return NextResponse.redirect(new URL(`/dashboard?b=${bizId}#social`, req.url), 303);
  }
  try {
    const key = await profileKeyFor(bizId, biz.name);
    return NextResponse.redirect(await connectUrl(key, back), 303);
  } catch (e) {
    return NextResponse.redirect(new URL(`/dashboard?b=${bizId}&social=error#social`, req.url), 303);
  }
}
