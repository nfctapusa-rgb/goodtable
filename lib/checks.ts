export type Status = "pass" | "fail" | "unknown";
export type Section = "search" | "experience" | "local";

export interface Check {
  id: string;
  section: Section;
  group: string;
  title: string;
  why: string;
  status: Status;
  found?: string;
  expected?: string;
  weight: number;
}

export interface GradeInput {
  url: string;
  html: string;
  finalUrl: string;
  responseMs: number;
  bytes: number;
  city?: string;
  keyword?: string;
  businessName?: string;
  robotsTxt?: string | null;
  sitemapOk?: boolean | null;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
   .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();

function meta(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)\\s*=\\s*["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  const c = tag.match(/content\s*=\s*["']([^"']*)["']/i);
  return c ? decode(c[1]) : "";
}

function tagText(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  return [...html.matchAll(re)].map(m => decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")));
}

function visibleText(html: string): string {
  return decode(
    html.replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ");
}

function links(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
}

function jsonLdTypes(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n: unknown) => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === "object") {
          const o = n as Record<string, unknown>;
          const t = o["@type"];
          if (typeof t === "string") out.push(t);
          if (Array.isArray(t)) t.forEach(x => typeof x === "string" && out.push(x));
          if (o["@graph"]) walk(o["@graph"]);
        }
      };
      walk(JSON.parse(m[1].trim()));
    } catch { }
  }
  return out;
}

const has = (s: string | null | undefined, needle?: string) =>
  !!s && !!needle && s.toLowerCase().includes(needle.toLowerCase());

const LOCAL_TYPES = /LocalBusiness|Restaurant|Store|Organization|Service|Salon|Dentist|Physician|AutoRepair|FoodEstablishment|ProfessionalService|HomeAndConstructionBusiness|HealthAndBeautyBusiness|SportsActivityLocation|Jewelry/i;
const SOCIAL = /(facebook|instagram|tiktok|x|twitter|youtube|linkedin|yelp|pinterest)\.com/i;
const OFFSITE = /(doordash|ubereats|grubhub|postmates|seamless|caviar|toasttab|chownow|slicelife|squareup\.com\/store|etsy|vagaro|styleseat|booksy|square\.site|fresha)/i;
const CTA = /\b(order( online| now)?|book( now| online| an appointment)?|schedule|reserve|buy now|shop( now)?|get a quote|request a quote|get started|call now|add to cart|checkout)\b/i;

export function runWebsiteChecks(i: GradeInput): Check[] {
  const { html, city, keyword } = i;
  const title = tagText(html, "title")[0] ?? null;
  const desc = meta(html, "description");
  const h1s = tagText(html, "h1");
  const h1 = h1s[0] ?? null;
  const text = visibleText(html);
  const words = text.split(" ").filter(Boolean).length;
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  const imgsNoAlt = imgs.filter(t => !/\balt\s*=\s*["'][^"']+["']/i.test(t));
  const hrefs = links(html);
  const types = jsonLdTypes(html);
  const rendersWithoutJs = words >= 80;
  const jsShell = !rendersWithoutJs && /<div id=["'](root|__next|app)["']/i.test(html);
  const u = (() => { try { return new URL(i.finalUrl); } catch { return null; } })();

  const c: Check[] = [];
  const add = (x: Omit<Check, "weight"> & { weight?: number }) => c.push({ weight: 1, ...x });
  const pf = (b: boolean): Status => (b ? "pass" : "fail");
  const needCity = (b: boolean): Status => (city ? pf(b) : "unknown");
  const needKw = (b: boolean): Status => (keyword ? pf(b) : "unknown");

  add({ id: "https", section: "search", group: "Domain", title: "Secure connection (HTTPS)",
    why: "Browsers warn visitors and Google demotes sites without HTTPS.",
    status: pf(u?.protocol === "https:"), found: u?.protocol, weight: 2 });
  add({ id: "title", section: "search", group: "Metadata", title: "Page title exists",
    why: "The title is the blue link people click in Google results.",
    status: pf(!!title), found: title ?? "None", weight: 2 });
  add({ id: "title-len", section: "search", group: "Metadata", title: "Page title length",
    why: "30–65 characters shows fully in search results.",
    status: title ? pf(title.length >= 30 && title.length <= 65) : "fail",
    found: title ? `${title.length} characters` : "None", expected: "30–65 characters" });
  add({ id: "title-city", section: "search", group: "Metadata", title: "Page title includes the service area",
    why: "Local searches like \"near me\" or \"in Downtown LA\" match titles that name the area.",
    status: needCity(has(title, city)), found: title ?? "None", expected: city });
  add({ id: "title-kw", section: "search", group: "Metadata", title: "Page title includes relevant keywords",
    why: "Name what you sell in the title so Google knows when to show you.",
    status: needKw(has(title, keyword)), found: title ?? "None", expected: keyword });
  add({ id: "desc", section: "search", group: "Metadata", title: "Meta description",
    why: "The snippet under your link. Without one, Google picks random page text.",
    status: pf(!!desc), found: desc || "None" });
  add({ id: "desc-len", section: "search", group: "Metadata", title: "Description length",
    why: "70–160 characters avoids getting cut off.",
    status: desc ? pf(desc.length >= 70 && desc.length <= 160) : "fail",
    found: desc ? `${desc.length} characters` : "None", expected: "70–160 characters" });
  add({ id: "desc-city", section: "search", group: "Metadata", title: "Description includes the service area",
    why: "Reinforces where you operate for local searches.",
    status: needCity(has(desc, city)), found: desc || "None", expected: city });
  add({ id: "h1", section: "search", group: "Headline", title: "Headline exists",
    why: "One clear H1 tells search engines what the page is about.",
    status: pf(!!h1), found: h1 ?? "None" });
  add({ id: "h1-city", section: "search", group: "Headline", title: "Headline includes the service area",
    why: "Mentioning your area in the headline helps you rank locally.",
    status: needCity(has(h1, city)), found: h1 ?? "None", expected: city });
  add({ id: "h1-kw", section: "search", group: "Headline", title: "Headline includes relevant keywords",
    why: "Your main headline should say what you do, not just a slogan.",
    status: needKw(has(h1, keyword)), found: h1 ?? "None", expected: keyword });
  add({ id: "og-title", section: "search", group: "Sharing", title: "Open Graph title",
    why: "Controls the title when your link is shared on Facebook, iMessage, Slack.",
    status: pf(!!meta(html, "og:title")) });
  add({ id: "og-desc", section: "search", group: "Sharing", title: "Open Graph description",
    why: "Controls the preview text on shared links.",
    status: pf(!!meta(html, "og:description")) });
  add({ id: "og-image", section: "search", group: "Sharing", title: "Open Graph image",
    why: "Shared links without an image get far fewer clicks.",
    status: pf(!!meta(html, "og:image")) });
  add({ id: "twitter", section: "search", group: "Sharing", title: "Twitter / X card",
    why: "Enables rich previews on X.",
    status: pf(!!meta(html, "twitter:card")) });
  add({ id: "alt", section: "search", group: "Content", title: "Images have alt text",
    why: "Alt text helps image search and screen readers.",
    status: imgs.length === 0 ? "unknown" : pf(imgsNoAlt.length / imgs.length <= 0.2),
    found: `${imgs.length - imgsNoAlt.length} of ${imgs.length} images`, expected: "80%+" });
  add({ id: "schema", section: "search", group: "Structured data", title: "Business schema markup",
    why: "LocalBusiness schema feeds Google and AI assistants your name, hours, and address.",
    status: pf(types.some(t => LOCAL_TYPES.test(t))),
    found: types.length ? types.join(", ") : "None", weight: 2 });
  add({ id: "canonical", section: "search", group: "Structured data", title: "Canonical URL",
    why: "Prevents duplicate versions of your page splitting ranking power.",
    status: pf(/<link[^>]+rel=["']canonical["']/i.test(html)) });
  add({ id: "viewport", section: "search", group: "Domain", title: "Mobile friendly",
    why: "Most local searches happen on phones; Google indexes mobile first.",
    status: pf(/<meta[^>]+name=["']viewport["']/i.test(html)), weight: 2 });
  add({ id: "lang", section: "search", group: "Domain", title: "Language declared",
    why: "Tells search engines which language audience to serve.",
    status: pf(/<html[^>]+lang\s*=/i.test(html)) });
  add({ id: "sitemap", section: "search", group: "Crawling", title: "Sitemap",
    why: "Helps Google find every page.",
    status: i.sitemapOk == null ? "unknown" : pf(i.sitemapOk) });
  add({ id: "robots", section: "search", group: "Crawling", title: "Robots.txt allows crawling",
    why: "A blocking robots.txt hides your site from Google and AI search.",
    status: i.robotsTxt == null ? "unknown"
      : pf(!/User-agent:\s*\*\s*[\r\n]+\s*Disallow:\s*\/\s*$/im.test(i.robotsTxt)) });
  add({ id: "ssr", section: "search", group: "Crawling", title: "Content visible without JavaScript",
    why: "Many crawlers and AI assistants don't run JavaScript. An empty shell looks like an empty site.",
    status: pf(!jsShell), found: `${words} words in raw HTML`, weight: 2 });

  const phone = hrefs.some(h => h.startsWith("tel:")) || /\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/.test(text);
  const ctaHit = hrefs.length && (CTA.test(text));
  const offsite = hrefs.filter(h => OFFSITE.test(h));
  add({ id: "cta", section: "experience", group: "Conversion", title: "Clear call to action",
    why: "Visitors need an obvious next step: order, book, buy, or get a quote.",
    status: pf(!!ctaHit), weight: 2 });
  add({ id: "offsite", section: "experience", group: "Conversion", title: "No off-site ordering or booking",
    why: "Sending customers to DoorDash, Etsy, or a third-party booking app costs you fees and the customer relationship.",
    status: pf(offsite.length === 0),
    found: offsite.length ? [...new Set(offsite.map(h => { try { return new URL(h).hostname; } catch { return h; } }))].join(", ") : "None",
    weight: 2 });
  add({ id: "phone", section: "experience", group: "Contact", title: "Phone number",
    why: "Many customers still want to call before buying.", status: pf(phone) });
  add({ id: "tap-call", section: "experience", group: "Contact", title: "Tap-to-call link",
    why: "On phones, a tel: link turns your number into a one-tap call.",
    status: pf(hrefs.some(h => h.startsWith("tel:"))) });
  add({ id: "address", section: "experience", group: "Contact", title: "Address or service area listed",
    why: "Confirms to customers and Google where you operate.",
    status: city ? pf(has(text, city)) : pf(/\b\d{2,5}\s+\w+.*\b(st|street|ave|avenue|blvd|rd|road|dr|way)\b/i.test(text)) });
  add({ id: "hours", section: "experience", group: "Contact", title: "Business hours",
    why: "\"Are they open?\" is the #1 question local searchers have.",
    status: pf(/\b(hours|open\s+(daily|today|mon|tue)|mon(day)?\s*[-–]\s*(fri|sun))/i.test(text) || /openingHours/i.test(html)) });
  add({ id: "social", section: "experience", group: "Trust", title: "Social media links",
    why: "Social profiles extend your reach and prove you're active.",
    status: pf(hrefs.some(h => SOCIAL.test(h))) });
  add({ id: "reviews", section: "experience", group: "Trust", title: "Reviews or testimonials on site",
    why: "Social proof is one of the strongest conversion drivers.",
    status: pf(/\b(reviews?|testimonials?|what (our )?(customers|clients|guests) say|stars?)\b|★/i.test(text)) });
  add({ id: "faq", section: "experience", group: "Content", title: "FAQ section",
    why: "Answers buyer questions and gives Google and AI assistants text to quote.",
    status: pf(/\b(faq|frequently asked)/i.test(text) || types.includes("FAQPage")) });
  add({ id: "about", section: "experience", group: "Content", title: "About / story section",
    why: "A real story builds trust and differentiates you.",
    status: pf(/\b(about us|our story|who we are|meet the|about)\b/i.test(text)) });
  add({ id: "words", section: "experience", group: "Content", title: "Sufficient text content",
    why: "Thin pages rarely rank. Aim for 300+ words describing what you offer.",
    status: pf(words >= 300), found: `${words} words`, expected: "300+" });
  add({ id: "favicon", section: "experience", group: "Polish", title: "Favicon",
    why: "The little icon in browser tabs and Google results. Missing looks unfinished.",
    status: pf(/<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html)) });
  add({ id: "speed", section: "experience", group: "Performance", title: "Server responds quickly",
    why: "Every extra second of load time loses visitors.",
    status: pf(i.responseMs < 1500), found: `${i.responseMs} ms`, expected: "< 1500 ms" });
  add({ id: "weight", section: "experience", group: "Performance", title: "Page size",
    why: "Heavy HTML slows phones on cellular data.",
    status: pf(i.bytes < 500_000), found: `${Math.round(i.bytes / 1024)} KB HTML`, expected: "< 500 KB" });

  return c;
}

export function score(checks: Check[], section: Section) {
  const s = checks.filter(c => c.section === section && c.status !== "unknown");
  const max = s.reduce((a, c) => a + c.weight, 0);
  const got = s.filter(c => c.status === "pass").reduce((a, c) => a + c.weight, 0);
  return { got, max };
}
