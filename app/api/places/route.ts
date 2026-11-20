import { NextResponse } from "next/server";
import { placesKey, searchPlaces } from "@/lib/places";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim().slice(0, 120) ?? "";
  const lat = Number(sp.get("lat")), lng = Number(sp.get("lng"));
  const near = Number.isFinite(lat) && Number.isFinite(lng) && sp.get("lat") ? { lat, lng } : undefined;
  if (!placesKey()) return NextResponse.json({ connected: false, results: [] });
  if (q.length < 2) return NextResponse.json({ connected: true, results: [] });
  try {
    const res = await searchPlaces(q, 6, near, true);
    return NextResponse.json({
      connected: true,
      results: res.map(p => ({ id: p.id, name: p.displayName?.text, address: p.formattedAddress, category: p.primaryTypeDisplayName?.text ?? null, website: p.websiteUri ?? null, rating: p.rating ?? null, reviews: p.userRatingCount ?? 0 })),
    });
  } catch (e) {
    console.error("places search failed:", (e as Error).message);
    return NextResponse.json({ connected: true, error: "Google search is having trouble right now.", results: [] }, { status: 502 });
  }
}
