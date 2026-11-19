// Single source of truth for what Lokly sells. Pricing page, grader offer,
// onboarding and Stripe checkout all read from here.

export type PlanId = "site" | "local" | "pro" | "ads";

export interface Plan {
  id: PlanId; name: string; price: number; cents: number; interval: "once" | "month";
  blurb: string; cta: string; highlight?: boolean; addon?: boolean;
}

export const PLANS: Plan[] = [
  { id: "local", name: "Google Management", price: 25, cents: 2500, interval: "month",
    blurb: "We run your Google Business Profile so you show up and stand out.", cta: "Start for $25/mo" },
  { id: "pro", name: "Lokly Pro", price: 89, cents: 8900, interval: "month", highlight: true,
    blurb: "Your website, Google profile and marketing, handled for one monthly price.", cta: "Start Lokly Pro" },
  { id: "site", name: "Website only", price: 150, cents: 15000, interval: "once",
    blurb: "A fast website built for local search. Yours to keep.", cta: "Get a website" },
  { id: "ads", name: "Lokly Ads", price: 149, cents: 14900, interval: "month", addon: true,
    blurb: "Done-for-you ads on Instagram, Facebook and Google. Ad budget paid separately to the ad platforms.", cta: "Add Lokly Ads" },
];

// Postcard mailers: price per campaign, printed and mailed by our print partner.
export const MAILERS = [
  { qty: 250, price: 199 },
  { qty: 500, price: 350 },
  { qty: 1000, price: 599 },
];

export type Avail = "yes" | "no" | "soon";
// Feature matrix: [feature, description, local, pro]. "soon" = coming soon, not sold as live.
export const FEATURES: { group: string; rows: [string, string, Avail, Avail][] }[] = [
  { group: "Google Business Profile", rows: [
    ["Full profile optimization", "Categories, services, hours, description and attributes set up to match what customers search.", "yes", "yes"],
    ["Every review answered", "A personal reply to each Google review, in your voice.", "yes", "yes"],
    ["Weekly posts & offers", "Specials, news and offers published to your profile on a schedule you approve.", "yes", "yes"],
    ["Fresh photos", "New photos added regularly so your profile stays active.", "yes", "yes"],
    ["Monthly report", "Calls, direction requests, profile views and where you show up.", "yes", "yes"],
  ]},
  { group: "Website", rows: [
    ["Custom website", "Built from your Google profile and photos, mobile-first and fast.", "no", "yes"],
    ["Local SEO setup", "Titles, descriptions, business schema, sitemap and local keywords.", "no", "yes"],
    ["Hosting, SSL & updates", "We host it and make your changes. Just text us.", "no", "yes"],
    ["Online ordering & booking", "Link your DoorDash, Uber Eats or booking page, or connect your POS (5% on direct online orders).", "no", "yes"],
  ]},
  { group: "Marketing", rows: [
    ["Review requests", "Ask happy customers for a Google review by text or email.", "no", "soon"],
    ["Email & text campaigns", "Promos, win-back and birthday messages sent for you.", "no", "soon"],
    ["Lokly AI assistant", "Ask questions about your business and get marketing written for you.", "no", "soon"],
  ]},
];

export const planById = (id: string) => PLANS.find(p => p.id === id);
export const priceText = (p: Plan) => `$${p.price}${p.interval === "month" ? "/mo" : " one-time"}`;
