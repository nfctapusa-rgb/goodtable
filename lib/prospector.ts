// Auto-prospector: finds local businesses with weak Google profiles, pulls a contact email from
// their website, and adds them to the outreach list. Businesses without a findable email go to a call list.
// New prospects are only queued for email when PROSPECTOR_AUTOQUEUE=1 (so the first batch can be reviewed).
import { db } from "./db";
import { searchPlaces, type Place } from "./places";

const CATEGORIES = [
  "barbershop", "hair salon", "nail salon", "auto repair", "auto detailing", "landscape lighting",
  "landscaping", "plumber", "electrician", "HVAC", "pest control", "house cleaning", "dog grooming",
  "florist", "bakery", "coffee shop", "taco shop", "pizza", "jewelry store", "tattoo shop",
  "dentist", "chiropractor", "med spa", "roofing", "pool service", "handyman", "moving company", "car wash",
];
const CITIES = [
  "Los Angeles CA", "Long Beach CA", "Pasadena CA", "Glendale CA", "Burbank CA", "Santa Monica CA",
  "Phoenix AZ", "Scottsdale AZ", "Mesa AZ", "Tempe AZ", "Chandler AZ", "Las Vegas NV", "Henderson NV",
  "San Diego CA", "Riverside CA", "Anaheim CA", "Irvine CA", "Houston TX", "Dallas TX", "Austin TX",
  "San Antonio TX", "Denver CO", "Miami FL", "Orlando FL", "Tampa FL", "Atlanta GA", "Charlotte NC",
];

const BAD_EMAIL = /(example\.|sentry|wixpress|godaddy|domain\.com|yourdomain|email\.com|\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|noreply|no-reply|donotreply|@2x|privacy@|abuse@|webmaster@)/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

async function ensure(sql: any) {
  await sql`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS place_id text`.catch(() => null);
  await sql`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS reviews int`.catch(() => null);
  await sql`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS rating real`.catch(() => null);
  await sql`CREATE TABLE IF NOT EXISTS prospector_queries (q text PRIMARY KEY, ran_at timestamptz NOT NULL DEFAULT now(), found int, emails int, calls int)`;
  await sql`CREATE TABLE IF NOT EXISTS prospect_calls (
    place_id text PRIMARY KEY, business_name text NOT NULL, phone text, website text, city text, category text,
    rating real, reviews int, reason text, status text NOT NULL DEFAULT 'new', created_at timestamptz NOT NULL DEFAULT now())`;
}

// A profile worth pitching: few reviews, low rating, no website, or no description/hours.
function weakness(p: Place): string | null {
  const n = p.userRatingCount ?? 0, r = p.rating ?? 0;
  const why: string[] = [];
  if (n < 40) why.push(`${n} reviews`);
  if (r && r < 4.3) why.push(`${r} stars`);
  if (!p.websiteUri) why.push("no website");
  if (!p.regularOpeningHours) why.push("no hours");
  if (!p.editorialSummary?.text) why.push("no description");
  if (n > 400) return null; // already strong, skip
  return why.length ? why.join(", ") : null;
}

async function fetchText(url: string, ms = 6000): Promise<string> {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; LoklyBot/1.0; +https://lokly.pro)" } });
    if (!r.ok || !/text\/html/.test(r.headers.get("content-type") ?? "")) return "";
    return (await r.text()).slice(0, 400_000);
  } catch { return ""; } finally { clearTimeout(t); }
}

// Finds a contact email on the homepage or a contact page. Prefers addresses on the business's own domain.
export async function findEmail(site: string): Promise<string | null> {
  let base: URL; try { base = new URL(site); } catch { return null; }
  if (/facebook\.com|instagram\.com|yelp\.com|google\.com|linktr\.ee|square\.site|toasttab|doordash|ubereats/i.test(base.hostname)) return null;
  const host = base.hostname.replace(/^www\./, "");
  const found = new Set<string>();
  const scan = (h: string) => {
    for (const m of h.replace(/&#64;|\[at\]|\(at\)/gi, "@").matchAll(EMAIL_RE)) {
      const e = m[0].toLowerCase().replace(/^mailto:/, "").replace(/[.,;]+$/, "");
      if (!BAD_EMAIL.test(e) && e.length < 80) found.add(e);
    }
  };
  const home = await fetchText(base.toString());
  scan(home);
  if (!found.size) {
    const links = [...home.matchAll(/href=["']([^"']*(contact|about)[^"']*)["']/gi)].map(m => m[1]).slice(0, 2);
    const tries = links.length ? links : ["/contact", "/contact-us"];
    for (const l of tries) { try { scan(await fetchText(new URL(l, base).toString())); } catch {} if (found.size) break; }
  }
  const list = [...found];
  return list.find(e => e.endsWith("@" + host)) ?? list.find(e => /@(gmail|yahoo|outlook|hotmail|icloud|aol)\./.test(e)) ?? list[0] ?? null;
}

// Runs `queries` searches (category + city) that haven't been run in 45 days.
export async function runProspector(queries = 2, perQuery = 20) {
  const sql = await db();
  await ensure(sql);
  const recent = new Set(((await sql`SELECT q FROM prospector_queries WHERE ran_at > now() - interval '45 days'`) as any[]).map(r => r.q));
  const all: { q: string; cat: string; city: string }[] = [];
  for (const city of CITIES) for (const cat of CATEGORIES) all.push({ q: `${cat} in ${city}`, cat, city });
  const todo = all.filter(x => !recent.has(x.q)).sort(() => Math.random() - 0.5).slice(0, queries);
  const auto = process.env.PROSPECTOR_AUTOQUEUE === "1";
  const results: any[] = [];
  for (const { q, cat, city } of todo) {
    let places: Place[] = [];
    try { places = await searchPlaces(q, perQuery); } catch (e) { results.push({ q, error: (e as Error).message }); continue; }
    let emails = 0, calls = 0;
    const added: any[] = [];
    const weak = places.filter(p => weakness(p) && p.id && p.displayName?.text);
    const mails = new Map<string, string | null>();
    for (let i = 0; i < weak.length; i += 6) {
      await Promise.all(weak.slice(i, i + 6).map(async p => mails.set(p.id, p.websiteUri ? await findEmail(p.websiteUri) : null)));
    }
    for (const p of weak) {
      const why = weakness(p)!;
      const name = p.displayName!.text;
      const cityName = city.replace(/ [A-Z]{2}$/, "");
      const email = mails.get(p.id) ?? null;
      if (email) {
        const [sup] = await sql`SELECT 1 FROM suppressions WHERE email = ${email}`.catch(() => []) as any[];
        if (sup) continue;
        const r = await sql`INSERT INTO prospects (business_name, email, phone, website, city, category, source, place_id, reviews, rating, notes, status, next_send_at)
          VALUES (${name.slice(0, 120)}, ${email}, ${p.nationalPhoneNumber ?? null}, ${p.websiteUri ?? null}, ${cityName}, ${cat}, 'auto-prospector',
            ${p.id}, ${p.userRatingCount ?? 0}, ${p.rating ?? null}, ${why}, ${auto ? "queued" : "new"}, ${auto ? new Date().toISOString() : null})
          ON CONFLICT (email) DO NOTHING RETURNING id` as any[];
        if (r.length) { emails++; added.push({ name, email, why }); }
      } else if (p.nationalPhoneNumber) {
        const r = await sql`INSERT INTO prospect_calls (place_id, business_name, phone, website, city, category, rating, reviews, reason)
          VALUES (${p.id}, ${name.slice(0, 120)}, ${p.nationalPhoneNumber}, ${p.websiteUri ?? null}, ${cityName}, ${cat}, ${p.rating ?? null}, ${p.userRatingCount ?? 0}, ${why})
          ON CONFLICT (place_id) DO NOTHING RETURNING place_id` as any[];
        if (r.length) { calls++; added.push({ name, phone: p.nationalPhoneNumber, why }); }
      }
    }
    await sql`INSERT INTO prospector_queries (q, found, emails, calls) VALUES (${q}, ${places.length}, ${emails}, ${calls})
      ON CONFLICT (q) DO UPDATE SET ran_at = now(), found = EXCLUDED.found, emails = EXCLUDED.emails, calls = EXCLUDED.calls`;
    results.push({ q, found: places.length, emails, calls, added });
  }
  return { autoQueue: auto, results };
}

// Moves reviewed auto-prospector leads into the email sequence.
export async function queueProspected() {
  const sql = await db();
  return sql`UPDATE prospects SET status = 'queued', next_send_at = now() WHERE status = 'new' AND source = 'auto-prospector' RETURNING id`;
}
