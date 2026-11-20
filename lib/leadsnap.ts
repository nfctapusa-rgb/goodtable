// Server-only LeadSnap client. Needs LEADSNAP_API_KEY (a LeadSnap API token).
const BASE = "https://app.leadsnap.com/public/api/v1";

function mdy(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}-${d.getUTCFullYear()}`;
}

async function get(path: string, query: Record<string, string> = {}) {
  const key = process.env.LEADSNAP_API_KEY;
  if (!key) return null;
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }, next: { revalidate: 3600 } });
  if (!r.ok) return null;
  return r.json();
}

export type GoogleStats = {
  appearances: { current: number; change_pct: number | null };
  actions: { current: number; change_pct: number | null };
  calls: { current: number; change_pct: number | null };
  trend: { period: string; maps: number; search: number }[];
  tips: { title: string; body: string }[];
  reviews: { count: number; rating: number; unreplied: number } | null;
};

export async function googleStats(locationId: string): Promise<GoogleStats | null> {
  if (!/^\d+$/.test(locationId)) return null;
  const end = new Date(Date.now() - 86400000), start = new Date(end.getTime() - 29 * 86400000);
  try {
    const [o, loc] = await Promise.all([
      get(`/locations/${locationId}/performance/overview`, { start_date: mdy(start), end_date: mdy(end) }),
      get(`/locations/${locationId}`),
    ]);
    if (!o?.cards) return null;
    const l = loc?.data ?? loc;
    return {
      appearances: o.cards.appearances, actions: o.cards.actions, calls: o.cards.calls,
      trend: (o.chart?.data ?? []).slice(-6),
      tips: (o.recommendations ?? []).slice(0, 2).map((t: any) => ({ title: t.title, body: t.body })),
      reviews: l?.review_count != null ? { count: l.review_count, rating: l.ave_review_rating, unreplied: l.unreplied_review_count ?? 0 } : null,
    };
  } catch { return null; }
}

export type Card = { current: number | null; prior: number | null; change_pct: number | null };
export type FullStats = {
  m1: { appearances: Card; actions: Card; calls: Card };
  m6: { appearances: Card; actions: Card; calls: Card };
  trend: { period: string; maps: number | null; search: number | null }[];
  reviews: { count: number; rating: number; unreplied: number } | null;
  asOf: string;
};

// 30-day and 6-month comparisons plus monthly trend. Live when LEADSNAP_API_KEY is set, else null.
export async function fullStats(locationId: string): Promise<FullStats | null> {
  if (!/^\d+$/.test(locationId)) return null;
  const end = new Date(Date.now() - 86400000);
  try {
    const [a, b, loc] = await Promise.all([
      get(`/locations/${locationId}/performance/overview`, { start_date: mdy(new Date(end.getTime() - 29 * 864e5)), end_date: mdy(end) }),
      get(`/locations/${locationId}/performance/overview`, { start_date: mdy(new Date(end.getTime() - 182 * 864e5)), end_date: mdy(end) }),
      get(`/locations/${locationId}`),
    ]);
    if (!a?.cards || !b?.cards) return null;
    const l = loc?.data ?? loc;
    return { m1: a.cards, m6: b.cards, trend: b.chart?.data ?? [],
      reviews: l?.review_count != null ? { count: l.review_count, rating: l.ave_review_rating, unreplied: l.unreplied_review_count ?? 0 } : null,
      asOf: new Date().toISOString() };
  } catch { return null; }
}
