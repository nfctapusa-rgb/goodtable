import type { FullStats } from "./leadsnap";

// Pick the honest good news. Every line is a real comparison from Google's data; we only choose
// which true comparisons to lead with (30 days, 6 months, best month, reviews). Nothing is invented.
const LABEL = { appearances: "Google views", actions: "Calls, website clicks & directions", calls: "Calls from Google" } as const;
export const MONTH = (p: string) => new Date(p + "-02T12:00:00Z").toLocaleString("en-US", { month: "short", timeZone: "UTC" });
const pct = (n: number) => (n >= 100 ? `${(n / 100 + 1).toFixed(1).replace(/\.0$/, "")}x` : `+${Math.round(n)}%`);

export function computeWins(s: FullStats) {
  const wins: { big: string; text: string }[] = [];
  const keys = ["appearances", "actions", "calls"] as const;
  for (const k of keys) {
    const a = s.m1[k], b = s.m6[k];
    if ((a.change_pct ?? 0) >= 3 && (a.current ?? 0) > 0) wins.push({ big: pct(a.change_pct!), text: `${LABEL[k]} vs the 30 days before` });
    else if ((b.change_pct ?? 0) >= 3 && (b.current ?? 0) > 0) wins.push({ big: pct(b.change_pct!), text: `${LABEL[k]} over the last 6 months` });
    else if ((a.prior ?? 0) === 0 && (a.current ?? 0) > 0) wins.push({ big: String(a.current), text: `${LABEL[k]} this month, up from zero` });
  }
  const months = s.trend.map(t => ({ m: t.period, v: (t.maps ?? 0) + (t.search ?? 0) })).filter(x => x.v > 0);
  if (months.length >= 2) {
    const best = months.reduce((x, y) => (y.v > x.v ? y : x)), low = months.reduce((x, y) => (y.v < x.v ? y : x));
    if (best !== low && best.v > low.v * 1.05) wins.push({ big: MONTH(best.m), text: `your best month on Google: ${best.v.toLocaleString()} views, ${pct(((best.v - low.v) / low.v) * 100)} over ${MONTH(low.m)}` });
  }
  if (s.reviews && s.reviews.count > 0 && s.reviews.rating >= 4) wins.push({ big: `${Number(s.reviews.rating).toFixed(1)}★`, text: `from ${s.reviews.count} Google reviews` });
  // Headline totals: always true and always impressive in absolute terms
  const views6 = s.m6.appearances.current ?? 0, acts6 = s.m6.actions.current ?? 0, calls6 = s.m6.calls.current ?? 0;
  const totals = [
    views6 > 0 && { n: views6, l: "times customers found you on Google", sub: "last 6 months" },
    acts6 > 0 && { n: acts6, l: "customers called, visited your site or got directions", sub: "last 6 months" },
    calls6 > 0 && { n: calls6, l: "phone calls straight from Google", sub: "last 6 months" },
  ].filter(Boolean) as { n: number; l: string; sub: string }[];
  return { wins: wins.slice(0, 4), totals, months, hasData: months.length > 0 || totals.length > 0 };
}
