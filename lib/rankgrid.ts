// Local rank map: search a keyword from a 5x5 grid of points around the business and record
// where it shows in Google's local results at each point (1-20, or null = not in top 20).
import { db } from "./db";

const G = () => process.env.GOOGLE_PLACES_API_KEY || "";
const S = () => process.env.SERPAPI_KEY || "";
export type Pt = { lat: number; lng: number };
export type Cell = Pt & { rank: number | null; top: string[] };

async function google(q: string, c: Pt, radius: number, fields = "places.id,places.displayName") {
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": G(), "X-Goog-FieldMask": fields },
    body: JSON.stringify({ textQuery: q, pageSize: 20, locationBias: { circle: { center: { latitude: c.lat, longitude: c.lng }, radius } } }),
  });
  if (!r.ok) throw new Error(`Places API ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return ((await r.json()).places ?? []) as any[];
}
async function serp(q: string, c: Pt) {
  const u = new URL("https://serpapi.com/search.json");
  for (const [k, v] of Object.entries({ engine: "google_maps", type: "search", q, ll: `@${c.lat},${c.lng},15z`, hl: "en", gl: "us", api_key: S() })) u.searchParams.set(k, v);
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) throw new Error(`SerpApi ${r.status}`);
  return ((await r.json()).local_results ?? []).map((x: any) => ({ id: x.place_id, displayName: { text: x.title } }));
}
const search = (q: string, c: Pt) => (G() ? google(q, c, 800) : serp(q, c));

// Where the business is, from its Google place id (or a name search).
export async function locate(placeId: string | null, name: string, address?: string | null): Promise<{ id: string; center: Pt } | null> {
  if (G()) {
    if (placeId) {
      const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, { cache: "no-store", headers: { "X-Goog-Api-Key": G(), "X-Goog-FieldMask": "id,location" } });
      if (r.ok) { const j = await r.json(); if (j.location) return { id: j.id, center: { lat: j.location.latitude, lng: j.location.longitude } }; }
    }
    const [p] = await google(`${name} ${address ?? "Los Angeles"}`, { lat: 34.05, lng: -118.25 }, 50000, "places.id,places.location");
    return p?.location ? { id: p.id, center: { lat: p.location.latitude, lng: p.location.longitude } } : null;
  }
  return null;
}

// 5x5 grid, `step` miles apart (default 0.5mi: covers about 2x2 miles, a neighborhood).
export function grid(c: Pt, step = 0.5, n = 5): Pt[] {
  const dLat = step / 69, dLng = step / (69 * Math.cos((c.lat * Math.PI) / 180)), h = (n - 1) / 2, out: Pt[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push({ lat: +(c.lat + (h - i) * dLat).toFixed(6), lng: +(c.lng + (j - h) * dLng).toFixed(6) });
  return out;
}

export async function scan(businessId: string, keyword: string, step = 0.5) {
  if (!G() && !S()) throw new Error("Add GOOGLE_PLACES_API_KEY (or SERPAPI_KEY) in Vercel to run rank scans.");
  const sql = await db();
  const [b] = await sql`SELECT id, name, place_id, address FROM businesses WHERE id = ${businessId}` as any[];
  if (!b) throw new Error("Business not found");
  const loc = await locate(b.place_id, b.name, b.address);
  if (!loc) throw new Error("Couldn't find this business on Google. Add its Google place id first.");
  if (!b.place_id) await sql`UPDATE businesses SET place_id = ${loc.id} WHERE id = ${b.id}`;
  const pts = grid(loc.center, step);
  const cells: Cell[] = [];
  for (let k = 0; k < pts.length; k += 5) {
    const batch = await Promise.all(pts.slice(k, k + 5).map(async p => {
      try {
        const res = await search(keyword, p);
        const i = res.findIndex((x: any) => x.id === loc.id);
        return { ...p, rank: i >= 0 ? i + 1 : null, top: res.slice(0, 3).map((x: any) => x.displayName?.text ?? "") };
      } catch { return { ...p, rank: null, top: [] }; }
    }));
    cells.push(...batch);
  }
  const ranks = cells.map(c => c.rank ?? 21);
  const avg = +(ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(1);
  const top3 = cells.filter(c => c.rank && c.rank <= 3).length;
  const [row] = await sql`INSERT INTO rank_scans (business_id, keyword, center, grid, avg, top3) VALUES (${b.id}, ${keyword}, ${JSON.stringify(loc.center)}::jsonb, ${JSON.stringify(cells)}::jsonb, ${avg}, ${top3}) RETURNING id, created_at` as any[];
  return { id: row.id, keyword, avg, top3, cells: cells.length, at: row.created_at };
}

// First and latest scan per keyword, for before/after.
export async function scansFor(businessId: string) {
  const sql = await db();
  const rows = await sql`SELECT keyword, grid, avg, top3, created_at FROM rank_scans WHERE business_id = ${businessId} ORDER BY created_at` as any[];
  const by = new Map<string, any[]>();
  for (const r of rows) by.set(r.keyword, [...(by.get(r.keyword) ?? []), r]);
  return [...by.entries()].map(([keyword, list]) => ({ keyword, first: list[0], last: list[list.length - 1], count: list.length }));
}
