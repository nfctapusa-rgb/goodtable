import { NextResponse } from "next/server";
import { inviteStats, sendInvites, inviteEmail } from "@/lib/menuinvite";
const ok = (k: string | null) => !!process.env.ADMIN_KEY && k === process.env.ADMIN_KEY;
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (!ok(u.searchParams.get("key"))) return new NextResponse("Not found", { status: 404 });
  const s = await inviteStats();
  return NextResponse.json({ pending: s.pending, sent: s.sent, recipients: s.list.map(p => `${p.business_name} | ${p.category ?? ""} | ${p.email}`), sample: s.list[0] ? inviteEmail(s.list[0]) : null });
}
export const maxDuration = 60;
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!ok(b.key)) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(await sendInvites(Number(b.limit ?? 25)));
}
