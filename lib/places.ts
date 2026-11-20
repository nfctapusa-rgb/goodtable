import type { Check } from "./checks";

const BASE = "https://places.googleapis.com/v1";
const F = ["id", "displayName", "formattedAddress", "rating", "userRatingCount", "websiteUri",
  "primaryTypeDisplayName", "types", "regularOpeningHours", "photos", "nationalPhoneNumber",
  "editorialSummary", "googleMapsUri", "addressComponents"];

export interface Place {
  id: string; displayName?: { text: string }; formattedAddress?: string; rating?: number;
  userRatingCount?: number; websiteUri?: string; primaryTypeDisplayName?: { text: string };
  types?: string[]; regularOpeningHours?: unknown; photos?: unknown[]; nationalPhoneNumber?: string;
  editorialSummary?: { text: string }; googleMapsUri?: string;
  addressComponents?: { longText: string; types: string[] }[];
}

const googleKey = () => process.env.GOOGLE_PLACES_API_KEY || "";
const serpKey = () => process.env.SERPAPI_KEY || "";
// True when any business-search provider is set up (Google Places, or SerpApi's free plan as fallback).
export const placesKey = () => googleKey() || serpKey();

// SerpApi reads public Google Maps listings. Used when Google isn't set up or is over its quota.
async function serp(params: Record<string, string>) {
  const u = new URL("https://serpapi.com/search.json");
  for (const [k, v] of Object.entries({ engine: "google_maps", hl: "en", gl: "us", ...params, api_key: serpKey() })) u.searchParams.set(k, v);
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) throw new Error(`SerpApi ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
const fromSerp = (x: any): Place => ({
  id: x.place_id, displayName: { text: x.title }, formattedAddress: x.address, rating: x.rating, userRatingCount: x.reviews,
  websiteUri: x.website, primaryTypeDisplayName: x.type ? { text: Array.isArray(x.type) ? x.type[0] : x.type } : undefined, types: x.types ?? (Array.isArray(x.type) ? x.type : undefined),
  regularOpeningHours: x.operating_hours ?? x.hours ?? undefined, nationalPhoneNumber: x.phone, editorialSummary: x.description ? { text: typeof x.description === "string" ? x.description : x.description.snippet ?? "" } : undefined,
  photos: x.photos_count ? Array(Math.min(x.photos_count, 50)).fill(0) : x.images ?? (x.thumbnail ? [x.thumbnail] : []),
  googleMapsUri: x.place_id ? `https://www.google.com/maps/place/?q=place_id:${x.place_id}` : undefined,
});
async function serpSearch(q: string, size: number, near?: { lat: number; lng: number }): Promise<Place[]> {
  const c = near ?? { lat: 34.0522, lng: -118.2437 };
  const j = await serp({ q, type: "search", ll: `@${c.lat},${c.lng},13z` });
  const list = j.local_results ?? (j.place_results ? [j.place_results] : []);
  return list.slice(0, size).map(fromSerp).filter((p: Place) => p.id);
}
const overQuota = (e: unknown) => /Places API (429|403)/.test(String((e as Error)?.message));

const LEAN = ["id", "displayName", "formattedAddress", "rating", "userRatingCount", "websiteUri", "primaryTypeDisplayName"];

// near: bias results toward the searcher (defaults to Los Angeles, where we sell).
// Google search calls are metered per day, so identical searches are cached for 7 days.
export async function searchPlaces(q: string, size = 20, near?: { lat: number; lng: number }, lean = false): Promise<Place[]> {
  const ck = `s:${lean ? 1 : 0}:${size}:${near ? `${near.lat},${near.lng}` : "la"}:${q.trim().toLowerCase().replace(/\s+/g, " ")}`;
  let sql: any = null;
  try {
    const { db, dbReady } = await import("./db");
    if (dbReady()) {
      sql = await db();
      const [hit] = await sql`SELECT v FROM places_cache WHERE k = ${ck} AND at > now() - interval '7 days'`;
      if (hit) return hit.v as Place[];
    }
  } catch {}
  const res = await searchPlacesLive(q, size, near, lean);
  if (sql) await sql`INSERT INTO places_cache (k, v) VALUES (${ck}, ${JSON.stringify(res)}) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, at = now()`.catch(() => null);
  return res;
}

async function searchPlacesLive(q: string, size: number, near: { lat: number; lng: number } | undefined, lean: boolean): Promise<Place[]> {
  if (!googleKey()) return serpSearch(q, size, near);
  try { return await googleSearch(q, size, near, lean); }
  catch (e) { if (serpKey() && overQuota(e)) return serpSearch(q, size, near); throw e; }
}

async function googleSearch(q: string, size: number, near: { lat: number; lng: number } | undefined, lean: boolean): Promise<Place[]> {
  const c = near ?? { lat: 34.0522, lng: -118.2437 };
  const r = await fetch(`${BASE}/places:searchText`, {
    method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": googleKey(), "X-Goog-FieldMask": (lean ? LEAN : F).map(f => "places." + f).join(",") },
    body: JSON.stringify({ textQuery: q, pageSize: size, locationBias: { circle: { center: { latitude: c.lat, longitude: c.lng }, radius: near ? 15000 : 50000 } } }),
  });
  if (!r.ok) throw new Error(`Places API ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return ((await r.json()).places ?? []) as Place[];
}

export async function getPlace(id: string): Promise<Place> {
  if (!googleKey()) return serpPlace(id);
  try { return await googlePlace(id); }
  catch (e) { if (serpKey() && overQuota(e)) return serpPlace(id); throw e; }
}
async function serpPlace(id: string): Promise<Place> {
  const j = await serp({ place_id: id });
  if (!j.place_results) throw new Error("Place not found");
  return { ...fromSerp(j.place_results), id };
}
async function googlePlace(id: string): Promise<Place> {
  const r = await fetch(`${BASE}/places/${encodeURIComponent(id)}`, {
    cache: "no-store", headers: { "X-Goog-Api-Key": googleKey(), "X-Goog-FieldMask": F.join(",") },
  });
  if (!r.ok) throw new Error(`Places API ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as Place;
}

// Up to 5 recent Google reviews (for social post drafts).
export async function getReviews(id: string): Promise<{ author: string; rating: number; text: string }[]> {
  if (!googleKey()) {
    try { const j = await serp({ engine: "google_maps_reviews", place_id: id, sort_by: "newestFirst" }); return (j.reviews ?? []).map((v: any) => ({ author: v.user?.name ?? "A customer", rating: v.rating ?? 0, text: v.snippet ?? "" })).filter((v: any) => v.text).slice(0, 5); } catch { return []; }
  }
  const r = await fetch(`${BASE}/places/${encodeURIComponent(id)}`, { headers: { "X-Goog-Api-Key": googleKey(), "X-Goog-FieldMask": "reviews" }, next: { revalidate: 86400 } } as any);
  if (!r.ok) return [];
  const j = await r.json();
  return (j.reviews ?? []).map((v: any) => ({ author: v.authorAttribution?.displayName ?? "A customer", rating: v.rating ?? 0, text: v.text?.text ?? v.originalText?.text ?? "" })).filter((v: any) => v.text);
}

export const cityOf = (p: Place) =>
  p.addressComponents?.find(c => c.types.includes("locality"))?.longText
  ?? p.addressComponents?.find(c => c.types.includes("sublocality"))?.longText;

const host = (u?: string) => { try { return new URL(u!).hostname.replace(/^www\./, ""); } catch { return ""; } };

export interface Ranking { query: string; position: number | null; top: string[] }

export async function runLocalChecks(opts: {
  businessName: string; city?: string; keyword?: string; siteUrl?: string; place?: Place;
}): Promise<{ connected: boolean; error?: string; checks: Check[]; rankings: Ranking[]; place?: Place }> {
  const base = (id: string, group: string, title: string, why: string): Check =>
    ({ id, section: "local", group, title, why, status: "unknown", weight: 1 });
  const checks: Check[] = [
    base("gbp", "Google Business Profile", "Google Business Profile found", "Your profile is what shows on Maps and the local pack."),
    base("gbp-site", "Google Business Profile", "Profile links to your website", "Sends Maps traffic to a site you own, not a third party."),
    base("gbp-hours", "Google Business Profile", "Hours set on profile", "Profiles without hours get filtered out of \"open now\" searches."),
    base("gbp-phone", "Google Business Profile", "Phone number on profile", "Lets people call straight from Maps."),
    base("gbp-desc", "Google Business Profile", "Profile description", "A keyword-rich description helps relevance."),
    base("gbp-photos", "Google Business Profile", "10+ photos", "Profiles with photos get more direction requests and clicks."),
    base("gbp-reviews", "Reviews", "50+ Google reviews", "Review count is a top local ranking factor."),
    base("gbp-rating", "Reviews", "4.5+ star rating", "Most customers filter out businesses below 4 stars."),
    base("gbp-cat", "Google Business Profile", "Category matches keywords", "Your primary category should match what customers search for."),
  ];
  if (!placesKey()) return { connected: false, checks, rankings: [] };

  try {
    const siteHost = host(opts.siteUrl);
    let place = opts.place;
    if (!place) {
      const m = await searchPlaces([opts.businessName, opts.city].filter(Boolean).join(" "));
      place = m.find(p => siteHost && host(p.websiteUri) === siteHost)
        ?? m.find(p => p.displayName?.text.toLowerCase().includes(opts.businessName.toLowerCase()));
    }
    const set = (id: string, ok: boolean, found?: string, expected?: string) => {
      const c = checks.find(x => x.id === id)!; c.status = ok ? "pass" : "fail"; c.found = found; c.expected = expected;
    };
    if (!place) {
      set("gbp", false, "No matching profile on Google Maps");
      checks.filter(c => c.id !== "gbp").forEach(c => { c.status = "fail"; c.found = "No profile"; });
    } else {
      set("gbp", true, `${place.displayName?.text} — ${place.formattedAddress ?? ""}`);
      set("gbp-site", !!place.websiteUri && (!siteHost || host(place.websiteUri) === siteHost), place.websiteUri ?? "None", siteHost || "Your website");
      set("gbp-hours", !!place.regularOpeningHours);
      set("gbp-phone", !!place.nationalPhoneNumber, place.nationalPhoneNumber ?? "None");
      set("gbp-desc", !!place.editorialSummary?.text, place.editorialSummary?.text ?? "None");
      const ph = place.photos?.length ?? 0;
      set("gbp-photos", ph >= 10, `${ph}${ph >= 10 ? "+" : ""}`, "10+");
      set("gbp-reviews", (place.userRatingCount ?? 0) >= 50, `${place.userRatingCount ?? 0} reviews`, "50+");
      set("gbp-rating", (place.rating ?? 0) >= 4.5, place.rating ? `${place.rating} stars` : "No rating", "4.5+");
      const cat = place.primaryTypeDisplayName?.text ?? place.types?.[0] ?? "";
      const kw = opts.keyword?.toLowerCase().split(/\s+/) ?? [];
      if (kw.length) set("gbp-cat", kw.some(w => cat.toLowerCase().includes(w)), cat || "None", opts.keyword);
      else checks.find(x => x.id === "gbp-cat")!.found = cat;
    }
    const rankings: Ranking[] = [];
    if (opts.keyword && opts.city) {
      for (const query of [`best ${opts.keyword} in ${opts.city}`, `${opts.keyword} near ${opts.city}`]) {
        const res = await searchPlaces(query);
        const idx = place ? res.findIndex(p => p.id === place!.id) : -1;
        rankings.push({ query, position: idx >= 0 ? idx + 1 : null, top: res.slice(0, 10).map(p => p.displayName?.text ?? "") });
      }
    }
    return { connected: true, checks, rankings, place };
  } catch (e) {
    return { connected: true, error: (e as Error).message, checks, rankings: [] };
  }
}
