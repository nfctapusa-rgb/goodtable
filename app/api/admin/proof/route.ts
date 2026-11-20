import { NextResponse } from "next/server";
import { sendProof } from "@/lib/lob";

export async function POST(req: Request) {
  const f = await req.formData();
  if (!process.env.ADMIN_KEY || f.get("key") !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const back = new URL(`/admin?key=${encodeURIComponent(String(f.get("key")))}#mailers`, req.url);
  try { await sendProof(Number(f.get("lead"))); } catch (e) { back.searchParams.set("err", (e as Error).message); }
  return NextResponse.redirect(back, 303);
}
