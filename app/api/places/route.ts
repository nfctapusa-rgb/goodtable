import { NextResponse } from "next/server";
import { placesKey, searchPlaces } from "@/lib/places";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 120) ?? "";
  if (!placesKey()) return NextResponse.json({ connected: false, results: [] });
  if (q.length < 2) return NextResponse.json({ connected: true, results: [] });
  try {
    const res = await searchPlaces(q, 6);
    return NextResponse.json({
      connected: true,
      results: res.map(p => ({ id: p.id, name: p.displayName?.text, address: p.formattedAddress, website: p.websiteUri ?? null, rating: p.rating ?? null, reviews: p.userRatingCount ?? 0 })),
    });
  } catch (e) {
    return NextResponse.json({ connected: true, error: (e as Error).message, results: [] }, { status: 502 });
  }
}
