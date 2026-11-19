import { NextResponse } from "next/server";
import { currentUser, businessFor } from "@/lib/auth";
import { saveLead } from "@/lib/leads";
import { toolById } from "@/lib/tools";

// A signed-in client asks us to turn on a marketing tool. Lands in admin under "Tool requests".
export async function POST(req: Request) {
  const f = await req.formData();
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const tool = toolById(String(f.get("tool") ?? ""));
  const bizId = String(f.get("b") ?? "");
  if (!tool) return new NextResponse("Unknown tool", { status: 400 });
  const biz: any = await businessFor(user.id, bizId).catch(() => null);
  await saveLead({ kind: "tool", source: "dashboard", businessName: biz?.name ?? null, website: biz?.website ?? null, email: user.email, plan: biz?.plan ?? null, data: { tool: tool.id, toolName: tool.name, businessId: bizId } });
  return NextResponse.redirect(new URL(`/dashboard?b=${encodeURIComponent(bizId)}&requested=${tool.id}#tools`, req.url), 303);
}
