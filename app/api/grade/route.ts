import { NextResponse } from "next/server";
import { runWebsiteChecks, score, type Check } from "@/lib/checks";
import { runLocalChecks, getPlace, cityOf, placesKey, type Place } from "@/lib/places";

export const runtime = "nodejs";
export const maxDuration = 30;

const UA = "Mozilla/5.0 (compatible; GoodTableGrader/1.0; +https://goodtable.us)";
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
  return NextResponse.json({
    url: finalUrl, businessName, city, keyword, placeId: local.place?.id ?? null,
    address: local.place?.formattedAddress ?? null,
    gradedAt: new Date().toISOString(),
    scores: { search: score(checks, "search"), experience: score(checks, "experience"), local: score(checks, "local") },
    placesConnected: local.connected, placesError: local.error, rankings: local.rankings, checks,
  });
}
