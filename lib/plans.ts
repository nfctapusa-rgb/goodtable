// Single source of truth for what Lokly sells. Pricing page, grader offer
// and Stripe checkout all read from here.

export type PlanId = "site" | "local" | "pro";

export interface Plan {
  id: PlanId; name: string; price: number; cents: number; interval: "once" | "month";
  blurb: string; cta: string; features: string[]; highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "site", name: "Lokly Site", price: 150, cents: 15000, interval: "once",
    blurb: "A fast, custom website built to rank #1 in local search.",
    cta: "Get my website",
    features: [
      "Custom website built from your Google profile",
      "Meta titles & descriptions for every page",
      "Business schema, sitemap and local keywords",
      "Mobile-first and fast",
      "Click-to-call, directions and hours",
      "Connect your own domain",
    ],
  },
  {
    id: "local", name: "Lokly Local", price: 49.99, cents: 4999, interval: "month", highlight: true,
    blurb: "We run your Google Business Profile so you show up and stand out.",
    cta: "Start Lokly Local",
    features: [
      "Full Google Business Profile optimization",
      "We reply to every review",
      "Daily & weekly Google posts",
      "Weekly offers published to your profile",
      "Fresh photos added regularly",
      "Hours, services and info kept accurate",
      "Monthly visibility report",
    ],
  },
  {
    id: "pro", name: "Lokly Pro", price: 99, cents: 9900, interval: "month",
    blurb: "Everything in Local, plus your website, online orders and growth tools.",
    cta: "Go Pro",
    features: [
      "Everything in Lokly Local",
      "Your Lokly website included, hosted & updated",
      "Online ordering: link DoorDash / Uber Eats, or connect your POS (5% of online sales)",
      "Lokly AI assistant",
      "Review request & customer win-back tools",
      "Monthly thank-you gift credits for your customers",
      "Priority support",
    ],
  },
];

export const planById = (id: string) => PLANS.find(p => p.id === id);
export const priceLabel = (p: Plan) => `$${p.price % 1 ? p.price.toFixed(2) : p.price}${p.interval === "month" ? "/mo" : " one-time"}`;
