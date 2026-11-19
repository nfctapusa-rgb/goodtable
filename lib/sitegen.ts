// Generates a website model for a business from its grader report and Google
// profile. Deterministic templates per industry; an AI copy pass can replace
// the copy functions later without changing the model shape.

export type Industry = "food" | "beauty" | "auto" | "retail" | "health" | "fitness" | "home" | "pro" | "other";

export interface SiteInput {
  businessName: string;
  city?: string;
  keyword?: string;
  address?: string | null;
  profile?: { phone: string | null; rating: number | null; reviews: number; category: string | null; summary: string | null; hours: string[] | null; mapsUrl: string | null; photos?: string[] } | null;
}

export interface SiteModel {
  name: string; industry: Industry; tagline: string; headline: string; sub: string;
  cta: string; ctaSecondary: string; services: { title: string; desc: string }[];
  about: string; faq: [string, string][]; city: string; phone: string | null; address: string | null;
  hours: string[] | null; rating: number | null; reviews: number; mapsUrl: string | null;
  meta: { title: string; description: string }; schemaType: string;
  eyebrow: string; headline2: string; offer: { when: string; title: string; sub: string };
  highlightsLabel: string; highlightsTitle: [string, string]; highlights: { tag: string; title: string; desc: string }[];
  aboutTitle: string; photos: string[];
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

const STYLE: Record<Industry, { tags: [string, string]; head2: string; offer: [string, string, string]; hl: string; hlt: [string, string]; items: [string, string, string][]; about: string }> = {
  food: { tags: ["Fresh", "Made to order"], head2: "Fresh off the grill.", offer: ["Every day until 4 PM", "10% off your first online order", "Order direct and skip the delivery app fees."], hl: "Menu highlights", hlt: ["Real food.", "Real photos."],
    items: [["Fan favorite", "House special", "Our most-ordered plate, made fresh to order."], ["Bowls", "Signature bowl", "A full meal, fast and fresh."], ["Plates", "Combo plate", "Two favorites on one plate."], ["Family", "Feed the group", "Big portions for the whole table."]], about: "built around flavor." },
  beauty: { tags: ["Book online", "Walk-ins welcome"], head2: "Look your best this week.", offer: ["New clients", "15% off your first visit", "Book online in under a minute."], hl: "Services", hlt: ["Real work.", "Real results."],
    items: [["Signature", "Signature service", "Our most-booked service."], ["Color", "Color & style", "From subtle to bold."], ["Grooming", "Finishing touches", "The details that make it."], ["Packages", "Gift cards", "The easiest gift to give."]], about: "where the details matter." },
  auto: { tags: ["Honest pricing", "Fast turnaround"], head2: "Back on the road, fast.", offer: ["This month", "$20 off any service over $100", "Book online and mention this offer."], hl: "Services", hlt: ["Real work.", "Fair prices."],
    items: [["Repair", "Diagnostics & repair", "We find it and fix it right."], ["Maintenance", "Oil & tune-ups", "Keep it running like new."], ["Tires", "Tires & brakes", "Safety you can feel."], ["Detail", "Detailing", "Inside and out."]], about: "you can trust with your car." },
  health: { tags: ["New patients welcome", "Book online"], head2: "Care that fits your life.", offer: ["New patients", "Free first consultation", "Book online in minutes."], hl: "Services", hlt: ["Real care.", "Real people."],
    items: [["Care", "Consultations", "We listen first."], ["Treatment", "Treatment plans", "Built around you."], ["Wellness", "Ongoing care", "Stay at your best."], ["Flexible", "Evening & weekend", "Times that work for you."]], about: "with care at the center." },
  fitness: { tags: ["All levels", "First class free"], head2: "Your strongest year starts here.", offer: ["New members", "First class free", "Book your spot online."], hl: "Classes", hlt: ["Real training.", "Real results."],
    items: [["Strength", "Strength", "Coached and progressive."], ["Cardio", "Conditioning", "Sweat with purpose."], ["Mobility", "Mobility", "Move better, feel better."], ["Coaching", "Personal training", "One-on-one focus."]], about: "built around community." },
  home: { tags: ["Licensed & insured", "Free estimates"], head2: "Done right the first time.", offer: ["This month", "$50 off your first job", "Request a free estimate online."], hl: "Services", hlt: ["Real work.", "Upfront prices."],
    items: [["Repair", "Repairs", "Fast, clean, done right."], ["Install", "Installations", "Done to code."], ["Emergency", "Emergency service", "When it can't wait."], ["Estimates", "Free estimates", "Know the price first."]], about: "that shows up and does it right." },
  pro: { tags: ["Trusted locally", "Free consultation"], head2: "Expert help, made simple.", offer: ["New clients", "Free 30-minute consultation", "Book a time online."], hl: "Services", hlt: ["Real expertise.", "Clear pricing."],
    items: [["Consult", "Consultations", "Talk it through, no pressure."], ["Service", "Core services", "Tailored to you."], ["Support", "Ongoing support", "We're here after, too."], ["Pricing", "Clear pricing", "No surprises."]], about: "you can count on." },
  retail: { tags: ["Shop local", "Shop online"], head2: "Find something you'll love.", offer: ["This week", "10% off your first order", "Shop online or visit us in store."], hl: "Featured", hlt: ["Real pieces.", "Real quality."],
    items: [["New", "New arrivals", "Just landed this week."], ["Best sellers", "Customer favorites", "Our most-loved pieces."], ["Custom", "Custom orders", "Made just for you."], ["Gifts", "Gift cards", "Always the right size."]], about: "curated with care." },
  other: { tags: ["Locally owned", "Easy booking"], head2: "Here when you need us.", offer: ["New customers", "10% off your first visit", "Reach out online to claim it."], hl: "What we do", hlt: ["Real service.", "Real people."],
    items: [["Service", "Our services", "Quality work, every time."], ["Local", "Local & trusted", "Proudly serving our community."], ["Easy", "Easy booking", "Reach us in seconds."], ["Support", "Friendly support", "Real people who care."]], about: "proudly local." },
};

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
    headline: `${what} in ${city}.`,
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
    eyebrow: [STYLE[industry].tags[0], STYLE[industry].tags[1], kw || what].join(" • ").toUpperCase(),
    headline2: STYLE[industry].head2,
    offer: { when: STYLE[industry].offer[0], title: STYLE[industry].offer[1], sub: STYLE[industry].offer[2] },
    highlightsLabel: STYLE[industry].hl, highlightsTitle: STYLE[industry].hlt,
    highlights: STYLE[industry].items.map(([tag, title, desc]) => ({ tag, title, desc })),
    aboutTitle: `${what} ${STYLE[industry].about}`,
    photos: (i.profile?.photos ?? []).map(n => `/api/photo?n=${encodeURIComponent(n)}`),
    meta: { title: `${i.businessName} | ${what} in ${city}`.slice(0, 65), description: `${i.businessName}: ${kw || "local business"} in ${city}. ${p.cta} online. ${proof}`.slice(0, 160) },
  };
}
