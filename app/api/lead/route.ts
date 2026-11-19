import { NextResponse } from "next/server";
import { saveLead } from "@/lib/leads";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  await saveLead({ kind: "report", source: `${b.src ?? "web"}:saved`, businessName: b.businessName, website: b.website, placeId: b.placeId, city: b.city, score: Number(b.score) || null, contactName: b.name, email, phone: b.phone });
  return NextResponse.json({ ok: true });
}
