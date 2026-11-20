import { NextResponse } from "next/server";
import { runWebsiteChecks, score, type Check } from "@/lib/checks";
import { runLocalChecks, getPlace, cityOf, placesKey, type Place } from "@/lib/places";
import { saveLead, reportScore } from "@/lib/leads";
import { track } from "@/lib/track";

export const runtime = "nodejs";
export const maxDuration = 30;

const UA = "Mozilla/5.0 (compatible; LoklyGrader/1.0; +https://lokly.pro)";
const isPublicHost = (h: string) =>
  !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?|.*\.local$|.*\.internal$)/i.test(h);

async function fetchText(url: string, ms = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,*/*" }, redirect: "follow", signal: ctl.signal, cache: "no-store" });
    return { ok: r.ok, status: r.status, url: r.url, text: await r.text() };
  } finally { clearTimeout(t); }
}

const noSite = (why: string): Check[] => [{
  id: "has-site", section: "search", group: "Website", title: "Has a website", weight: 4, status: "fail",
  why: "Without a website you can't take orders or bookings directly, and Google has far less to rank you on.", found: why,
}, {
  id: "has-site-x", section: "experience", group: "Website", title: "Customers can buy or book online", weight: 4, status: "fail",
  why: "Customers who can't act online go to a competitor who lets them.", found: why,
}];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let raw = String(body.url ?? "").trim();
  let businessName = String(body.businessName ?? "").trim().slice(0, 120);
  let city = String(body.city ?? "").trim().slice(0, 80) || undefined;
  let keyword = String(body.keyword ?? "").trim().slice(0, 80) || undefined;
  const placeId = String(body.placeId ?? "").trim();
  const manual = {
    address: String(body.address ?? "").trim().slice(0, 160), phone: String(body.phone ?? "").trim().slice(0, 30),
    mapsUrl: /^https:\/\/(www\.)?google\.|^https:\/\/maps\./.test(String(body.mapsUrl ?? "")) ? String(body.mapsUrl).slice(0, 500) : "",
    hasGoogle: ["yes", "no", "unsure"].includes(body.hasGoogle) ? body.hasGoogle : null,
  };

  let place: Place | undefined;
  if (placeId && placesKey()) {
    try {
      place = await getPlace(placeId);
      businessName ||= place.displayName?.text ?? "";
      raw ||= place.websiteUri ?? "";
      city ||= cityOf(place);
      keyword ||= place.primaryTypeDisplayName?.text?.toLowerCase();
    } catch { }
  }
  if (!raw && !place && !businessName) return NextResponse.json({ error: "Enter a website or pick your business from Google Maps." }, { status: 400 });

  let site: Check[] = [];
  let finalUrl: string | null = null;
  if (raw) {
    if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    let target: URL;
    try { target = new URL(raw); } catch { return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 }); }
    if (!isPublicHost(target.hostname)) return NextResponse.json({ error: "Only public websites can be graded." }, { status: 400 });
    const t0 = Date.now();
    const page = await fetchText(target.toString()).catch(() => null);
    const responseMs = Date.now() - t0;
    if (!page || !page.ok) {
      site = noSite(page ? `${target.hostname} returned HTTP ${page.status}` : `Couldn't reach ${target.hostname}`);
    } else {
      finalUrl = page.url;
      const origin = new URL(page.url).origin;
      const [robots, sitemap] = await Promise.all([
        fetchText(`${origin}/robots.txt`, 5000).then(r => (r.ok ? r.text : "")).catch(() => null),
        fetchText(`${origin}/sitemap.xml`, 5000).then(r => r.ok && /<(urlset|sitemapindex)/i.test(r.text)).catch(() => null),
      ]);
      const sitemapOk = sitemap || (!!robots && /^sitemap:/im.test(robots)) || sitemap;
      site = runWebsiteChecks({ url: raw, html: page.text, finalUrl: page.url, responseMs, bytes: Buffer.byteLength(page.text), city, keyword, businessName, robotsTxt: robots, sitemapOk });
      businessName ||= page.text.match(/<meta[^>]+og:site_name["'][^>]+content=["']([^"']+)/i)?.[1] || target.hostname.replace(/^www\./, "").split(".")[0];
    }
  } else {
    site = noSite(place ? "No website on your Google profile" : "No website provided");
  }

  const local = await runLocalChecks({ businessName, city, keyword, siteUrl: finalUrl ?? undefined, place });
  const checks = [...site, ...local.checks];
  const out = {
    url: finalUrl, businessName, city, keyword, placeId: local.place?.id ?? null,
    address: local.place?.formattedAddress ?? null,
    profile: local.place ? {
      phone: local.place.nationalPhoneNumber ?? null,
      rating: local.place.rating ?? null,
      reviews: local.place.userRatingCount ?? 0,
      category: local.place.primaryTypeDisplayName?.text ?? null,
      summary: local.place.editorialSummary?.text ?? null,
      hours: (local.place.regularOpeningHours as any)?.weekdayDescriptions ?? null,
      mapsUrl: local.place.googleMapsUri ?? null,
      photos: ((local.place.photos as any[]) ?? []).slice(0, 8).map(p => p.name).filter(Boolean),
    } : null,
    gradedAt: new Date().toISOString(),
    scores: { search: score(checks, "search"), experience: score(checks, "experience"), local: score(checks, "local") },
    manual: placeId ? null : manual,
    placesConnected: local.connected, placesError: local.error, rankings: local.rankings, checks,
  };
  if (body.pid && /^\d+\.[\w-]{24}$/.test(String(body.pid))) {
    const [pid, t] = String(body.pid).split(".");
    const { ptoken } = await import("@/lib/outreach");
    if (ptoken(pid) === t) {
      const sqlp = await (await import("@/lib/db")).db();
      await sqlp`UPDATE prospects SET report_at = COALESCE(report_at, now()), score = ${reportScore(out as any)}, status = CASE WHEN status IN ('customer') THEN status ELSE 'report' END, next_send_at = NULL WHERE id = ${Number(pid)}`.catch(() => null);
    }
  }
  await saveLead({ kind: "report", source: String(body.src ?? "web"), businessName: out.businessName, website: out.url, placeId: out.placeId, city: out.city, phone: manual.phone || undefined, score: reportScore(out as any), data: placeId ? undefined : { ...manual, needsGoogleProfile: manual.hasGoogle !== "yes", keyword } });
  await track("grade", { meta: { score: reportScore(out as any), business: out.businessName?.slice(0, 120), place: out.placeId } });
  return NextResponse.json(out);
}
