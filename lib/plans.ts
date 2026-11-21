// Single source of truth for what Lokly sells. Pricing page, grader offer,
// onboarding and Stripe checkout all read from here.

export type PlanId = "site" | "local" | "pro" | "ads";

export interface Plan {
  id: PlanId; name: string; price: number; listPrice?: number; cents: number; interval: "once" | "month";
  blurb: string; cta: string; highlight?: boolean; addon?: boolean;
}

export const PLANS: Plan[] = [
  { id: "local", name: "Google Management", price: 25, listPrice: 29, cents: 2500, interval: "month",
    blurb: "We run your Google profile: review replies, weekly posts and offers, fresh photos, plus a monthly email with your numbers and what we're improving. Free NFC review card.", cta: "Start for $25/mo" },
  { id: "site", name: "Website Package", price: 299, cents: 29900, interval: "once", highlight: true,
    blurb: "We build your website and optimize your Google profile. Your first 3 months of management are free, then $39/mo covers management, hosting and up to 3 changes a week.", cta: "Get my website" },
  { id: "pro", name: "Lokly Pro", price: 99, cents: 9900, interval: "month",
    blurb: "Everything in management plus your website, online ordering, a live analytics dashboard and our marketing tools. We fully set up your search presence: Google Search Console, Bing Webmaster Tools and Bing Places, Apple Business Connect (Apple Maps), Yelp and Facebook listings, AI-search setup so ChatGPT can find you, and articles about your business on Medium and LinkedIn.", cta: "Start Lokly Pro" },
  { id: "ads", name: "Lokly Ads", price: 149, cents: 14900, interval: "month", addon: true,
    blurb: "Done-for-you ads on Instagram, Facebook and Google. Ad budget paid separately to the ad platforms.", cta: "Add Lokly Ads" },
];
// Website Package: after the build, $39/mo starts once the free months end.
export const SITE_FREE_MONTHS = 3;
export const SITE_MONTHLY_CENTS = 3900;
// Google Management is $29/mo list; the first 50 clients lock in $25 for life.
export const FOUNDING_NOTE = "Founding price, regularly $29. Locked in for life for our first 50 clients.";

// Postcard mailers: price per campaign, printed and mailed by our print partner.
export const MAILERS = [
  { qty: 250, price: 349 },
  { qty: 500, price: 599 },
  { qty: 1000, price: 999 },
];

export type Avail = "yes" | "no" | "soon";
// Feature matrix: [feature, description, local, pro]. "soon" = coming soon, not sold as live.
export const FEATURES: { group: string; rows: [string, string, Avail, Avail][] }[] = [
  { group: "Google Business Profile", rows: [
    ["Full profile optimization", "Categories, services, hours, description and attributes set up to match what customers search.", "yes", "yes"],
    ["Every review answered", "A personal reply to each Google review, in your voice.", "yes", "yes"],
    ["Weekly posts & offers", "Specials, news and offers published to your profile on a schedule you approve.", "yes", "yes"],
    ["Fresh photos", "New photos added regularly so your profile stays active.", "yes", "yes"],
    ["Free NFC review card", "A tap-to-review card for your counter. Customers tap it with their phone and land on your Google review page.", "yes", "yes"],
  ]},
  { group: "Reporting", rows: [
    ["Monthly email report", "Calls, direction requests, profile views, and what we're improving next.", "yes", "yes"],
    ["Live analytics dashboard", "Your Google numbers any time, with month-over-month trends.", "no", "yes"],
  ]},
  { group: "Website", rows: [
    ["Custom website", "Built from your Google profile and photos, mobile-first and fast.", "no", "yes"],
    ["Hosting & 3 to 5 changes a week", "We host it and make your changes. Just text us.", "no", "yes"],
    ["Online ordering & booking", "Link your DoorDash, Uber Eats or booking page, or connect your POS (5% on direct online orders).", "no", "yes"],
  ]},
];

export const planById = (id: string) => PLANS.find(p => p.id === id);
export const priceText = (p: Plan) => `$${p.price}${p.interval === "month" ? "/mo" : " one-time"}`;
