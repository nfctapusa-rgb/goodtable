// Generates a website model for a business from its grader report and Google
// profile. Deterministic templates per industry; an AI copy pass can replace
// the copy functions later without changing the model shape.

export type Industry = "food" | "beauty" | "auto" | "retail" | "health" | "fitness" | "home" | "pro" | "other";

export interface SiteInput {
  businessName: string;
  city?: string;
  keyword?: string;
  address?: string | null;
  profile?: { phone: string | null; rating: number | null; reviews: number; category: string | null; summary: string | null; hours: string[] | null; mapsUrl: string | null } | null;
}

export interface SiteModel {
  name: string; industry: Industry; tagline: string; headline: string; sub: string;
  cta: string; ctaSecondary: string; services: { title: string; desc: string }[];
  about: string; faq: [string, string][]; city: string; phone: string | null; address: string | null;
  hours: string[] | null; rating: number | null; reviews: number; mapsUrl: string | null;
  meta: { title: string; description: string }; schemaType: string;
}

const RULES: [Industry, RegExp][] = [
  ["food", /restaurant|food|cafe|coffee|bakery|pizza|\bbar\b|grill|hibachi|sushi|taco|kitchen|diner|catering|deli|bbq|burger|ramen|thai|mexican|chinese|japanese|italian/i],
  ["beauty", /salon|barber|hair|nail|spa|beauty|lash|brow|wax|tattoo|esthetic/i],
  ["auto", /auto|car|tire|mechanic|detail|body shop|smog|oil|transmission|towing/i],
  ["health", /dent|doctor|clinic|chiro|therap|medical|med spa|wellness|optom|physio|vet/i],
  ["fitness", /gym|fitness|yoga|pilates|crossfit|martial|boxing|trainer|dance/i],
  ["home", /plumb|electric|hvac|roof|contract|clean|landscap|pest|paint|handyman|moving|construction|remodel/i],
  ["pro", /law|attorney|account|tax|insurance|real estate|realtor|consult|agency|marketing|photograph|transport|limo|chauffeur/i],
  ["retail", /store|shop|boutique|jewel|cloth|gift|florist|furniture|retail|market|book/i],
];

export function detectIndustry(text: string): Industry {
  for (const [k, re] of RULES) if (re.test(text)) return k;
  return "other";
}

const PRESET: Record<Industry, { cta: string; cta2: string; services: (kw: string) => [string, string][]; verb: string; schema: string }> = {
  food: { cta: "Order online", cta2: "View menu", verb: "made fresh", schema: "Restaurant",
    services: kw => [["Order for pickup", "Skip the line. Order ahead and it's ready when you arrive."], ["Delivery", "Hot and fresh to your door, ordered direct."], ["Catering", `Feed your office or party with our ${kw || "food"}.`]] },
  beauty: { cta: "Book now", cta2: "See services", verb: "done right", schema: "BeautySalon",
    services: kw => [[kw ? cap(kw) : "Signature services", "Our most-requested service, by experienced pros."], ["Book online 24/7", "Pick your stylist and time in seconds."], ["Gift cards", "The easiest gift for anyone in your life."]] },
  auto: { cta: "Book service", cta2: "Get a quote", verb: "you can trust", schema: "AutoRepair",
    services: kw => [[kw ? cap(kw) : "Repairs & maintenance", "Honest diagnostics and fair prices."], ["Free estimates", "Know the price before we start."], ["Fast turnaround", "Most jobs done same or next day."]] },
  health: { cta: "Book appointment", cta2: "Our services", verb: "with care", schema: "MedicalBusiness",
    services: kw => [[kw ? cap(kw) : "Consultations", "Personal care from a team that listens."], ["New patients welcome", "Book your first visit online."], ["Flexible scheduling", "Morning, evening and weekend times."]] },
  fitness: { cta: "Book a class", cta2: "See schedule", verb: "that works", schema: "SportsActivityLocation",
    services: kw => [[kw ? cap(kw) : "Classes", "Coached sessions for every level."], ["Memberships", "Simple monthly plans, cancel anytime."], ["First class free", "Try us before you commit."]] },
  home: { cta: "Get a free quote", cta2: "Call now", verb: "done right the first time", schema: "HomeAndConstructionBusiness",
    services: kw => [[kw ? cap(kw) : "Service & repair", "Licensed pros, upfront pricing."], ["Free estimates", "Tell us about the job and get a quote fast."], ["Emergency service", "When it can't wait, we pick up."]] },
  pro: { cta: "Book a consultation", cta2: "Contact us", verb: "you can count on", schema: "ProfessionalService",
    services: kw => [[kw ? cap(kw) : "Our services", "Expert help tailored to you."], ["Free consultation", "Talk through your needs, no obligation."], ["Clear pricing", "No surprises, ever."]] },
  retail: { cta: "Shop now", cta2: "Visit us", verb: "you'll love", schema: "Store",
    services: kw => [[kw ? cap(kw) : "Our collection", "Hand-picked and quality checked."], ["Shop online", "Order online for pickup or shipping."], ["Custom orders", "Tell us what you're looking for."]] },
  other: { cta: "Get started", cta2: "Contact us", verb: "you can rely on", schema: "LocalBusiness",
    services: kw => [[kw ? cap(kw) : "What we do", "Quality work from a local team."], ["Easy booking", "Reach us online in seconds."], ["Local & trusted", "Proudly serving our community."]] },
};

function cap(s: string) { return s.replace(/\b\w/g, c => c.toUpperCase()); }

export function generateSite(i: SiteInput): SiteModel {
  const kw = (i.keyword || i.profile?.category || "").toLowerCase();
  const industry = detectIndustry(`${kw} ${i.profile?.category ?? ""} ${i.businessName}`);
  const p = PRESET[industry];
  const city = i.city || "your area";
  const what = kw ? cap(kw) : "Local business";
  const rating = i.profile?.rating ?? null, reviews = i.profile?.reviews ?? 0;
  const proof = rating && reviews ? `Rated ${rating}★ by ${reviews.toLocaleString()} customers.` : "";
  return {
    name: i.businessName, industry, schemaType: p.schema,
    tagline: `${what} in ${city}`,
    headline: `${city}'s ${what.toLowerCase()} ${p.verb}.`,
    sub: i.profile?.summary || `${i.businessName} is ${city}'s go-to for ${kw || "quality service"}. ${proof}`.trim(),
    cta: p.cta, ctaSecondary: p.cta2,
    services: p.services(kw).map(([title, desc]) => ({ title, desc })),
    about: `${i.businessName} serves ${city} and the surrounding neighborhoods. We're a local business that cares about doing things right, and it shows in every ${industry === "food" ? "plate" : industry === "retail" ? "piece" : "visit"}.`,
    faq: [
      [`Where is ${i.businessName} located?`, i.address ? `We're at ${i.address}.` : `We serve ${city} and nearby areas.`],
      [`What are your hours?`, i.profile?.hours?.length ? i.profile.hours.join(" · ") : "Contact us for current hours."],
      [`How do I ${p.cta.toLowerCase()}?`, `Tap "${p.cta}" anywhere on this page. It takes less than a minute.`],
    ],
    city, phone: i.profile?.phone ?? null, address: i.address ?? null, hours: i.profile?.hours ?? null,
    rating, reviews, mapsUrl: i.profile?.mapsUrl ?? null,
    meta: { title: `${i.businessName} | ${what} in ${city}`.slice(0, 65), description: `${i.businessName}: ${kw || "local business"} in ${city}. ${p.cta} online. ${proof}`.slice(0, 160) },
  };
}
