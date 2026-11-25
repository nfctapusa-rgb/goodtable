import { NextResponse } from "next/server";
import { placeFromCid, searchPlaces } from "@/lib/places";

// Preview-only diagnostics for business lookup. Disabled in production.
export async function GET(req: Request) {
  if (process.env.VERCEL_ENV === "production") return NextResponse.json({ error: "not found" }, { status: 404 });
  const sp = new URL(req.url).searchParams;
  const out: Record<string, unknown> = {};
  const cid = sp.get("cid"), q = sp.get("q");
  if (cid) {
    try {
      const u = new URL("https://serpapi.com/search.json");
      for (const [k, v] of Object.entries({ engine: "google_maps", data_cid: cid, hl: "en", gl: "us", api_key: process.env.SERPAPI_KEY || "" })) u.searchParams.set(k, v);
      const r = await fetch(u, { cache: "no-store" });
      const j = await r.json();
      out.serpStatus = r.status; out.serpKeys = Object.keys(j); out.serpError = j.error ?? null;
      out.place_results = j.place_results ? { title: j.place_results.title, place_id: j.place_results.place_id, address: j.place_results.address, rating: j.place_results.rating, reviews: j.place_results.reviews } : null;
    } catch (e) { out.serpErr = String(e); }
    try { out.placeFromCid = await placeFromCid(cid); } catch (e) { out.placeFromCidErr = String(e); }
  }
  if (q) { try { out.search = (await searchPlaces(q, 5)).map(p => ({ id: p.id, name: p.displayName?.text, addr: p.formattedAddress })); } catch (e) { out.searchErr = String(e); } }
  return NextResponse.json(out);
}
