// Brand kit: pulls logo, colors, photos, tagline and social links from a client's own website
// (and Google profile photos when we have a place id). Used for postcards and social posts.
import { db } from "./db";
import { getPlace, placesKey } from "./places";

export interface BrandKit {
  source?: string; fetchedAt: string; title?: string; tagline?: string; logo?: string; color?: string;
  photos: string[]; instagram?: string; facebook?: string; tiktok?: string; phone?: string;
}

const abs = (u: string, base: string) => { try { return new URL(u.replace(/&amp;/g, "&"), base).toString(); } catch { return ""; } };
const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];

export async function buildBrandKit(site?: string | null, placeId?: string | null): Promise<BrandKit> {
  const kit: BrandKit = { fetchedAt: new Date().toISOString(), photos: [] };
  if (site) {
    try {
      const url = /^https?:\/\//.test(site) ? site : `https://${site}`;
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; LoklyBot/1.0; +https://lokly.pro)" }, redirect: "follow" });
      clearTimeout(t);
      const html = (await r.text()).slice(0, 1_500_000);
      const base = r.url || url;
      kit.source = base;
      const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
      const meta = (k: string) => { for (const m of metas) { if ((attr(m, "property") ?? attr(m, "name"))?.toLowerCase() === k) return attr(m, "content"); } };
      kit.title = (meta("og:site_name") ?? html.match(/<title[^>]*>([^<]{1,120})/i)?.[1])?.trim();
      kit.tagline = (meta("og:description") ?? meta("description"))?.trim().slice(0, 200);
      kit.color = meta("theme-color");
      const links = html.match(/<link\b[^>]*>/gi) ?? [];
      const icon = links.find(l => /apple-touch-icon/i.test(attr(l, "rel") ?? "")) ?? links.find(l => /\bicon\b/i.test(attr(l, "rel") ?? ""));
      const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
      const logoImg = imgs.find(i => /logo/i.test(i));
      const logoSrc = logoImg ? (attr(logoImg, "src") ?? attr(logoImg, "data-src")) : undefined;
      kit.logo = logoSrc ? abs(logoSrc, base) : icon ? abs(attr(icon, "href") ?? "", base) : undefined;
      const og = meta("og:image");
      const photos = new Set<string>();
      if (og) photos.add(abs(og, base));
      for (const i of imgs) {
        const src = attr(i, "src") ?? attr(i, "data-src") ?? attr(i, "srcset")?.split(/\s+/)[0];
        if (!src || /logo|icon|sprite|pixel|avatar|\.svg|data:/i.test(i + src)) continue;
        const w = Number(attr(i, "width") ?? 0); if (w && w < 300) continue;
        const u = abs(src, base); if (u) photos.add(u);
        if (photos.size >= 12) break;
      }
      kit.photos = [...photos].filter(Boolean);
      const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
      kit.instagram = hrefs.find(h => /instagram\.com\/[^/?#]+/i.test(h) && !/\/(p|reel|explore)\//.test(h));
      kit.facebook = hrefs.find(h => /facebook\.com\/[^/?#]+/i.test(h) && !/sharer|share\.php/.test(h));
      kit.tiktok = hrefs.find(h => /tiktok\.com\/@/i.test(h));
      kit.phone = hrefs.find(h => /^tel:/i.test(h))?.slice(4);
    } catch { /* site unreachable: keep what we have */ }
  }
  if (placeId && placesKey()) {
    try {
      const p = await getPlace(placeId);
      for (const ph of ((p.photos as any[]) ?? []).slice(0, 8)) if (ph?.name) kit.photos.push(`/api/photo?n=${encodeURIComponent(ph.name)}`);
      kit.title ||= p.displayName?.text; kit.phone ||= p.nationalPhoneNumber;
    } catch {}
  }
  kit.photos = kit.photos.slice(0, 16);
  return kit;
}

export async function refreshBrandKit(businessId: string) {
  const sql = await db();
  const [b] = await sql`SELECT website, place_id FROM businesses WHERE id = ${businessId}` as any[];
  if (!b) return null;
  const kit = await buildBrandKit(b.website, b.place_id);
  await sql`UPDATE businesses SET assets = ${JSON.stringify(kit)} WHERE id = ${businessId}`;
  return kit;
}
