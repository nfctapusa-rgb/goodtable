// Lokly marketing tools. status: "live" = works in the app today,
// "managed" = our team runs it for you now (automation coming), "soon" = in development.
export type ToolStatus = "live" | "managed" | "soon";
export interface Tool { id: string; name: string; desc: string; status: ToolStatus; included: "local" | "pro" | "addon"; price?: string; cents?: number; monthly?: boolean }

export const MARKETING_TOOLS: Tool[] = [
  { id: "reviews", name: "Review booster", desc: "Your Google review link, a printable QR code and a ready-to-send text, plus the free NFC tap card.", status: "live", included: "local" },
  { id: "social", name: "Social posting", desc: "Posts for Instagram, Facebook and TikTok made from your photos, offers and best reviews. You approve, we publish.", status: "managed", included: "pro", price: "$49/mo", cents: 4900, monthly: true },
  { id: "campaigns", name: "Email & text campaigns", desc: "Promos, slow-day specials, win-back and birthday messages sent to your customer list.", status: "managed", included: "pro", price: "$39/mo", cents: 3900, monthly: true },
  { id: "review-requests", name: "Automatic review requests", desc: "A text or email to each customer after their visit asking for a Google review.", status: "soon", included: "pro" },
  { id: "ai", name: "Lokly AI assistant", desc: "Ask about your numbers and get posts, offers and replies written for you.", status: "soon", included: "pro" },
  { id: "mailers", name: "Postcard mailers", desc: "Postcards to homes near your shop with a tracked QR code.", status: "live", included: "addon", price: "from $349" },
  { id: "nfc", name: "Extra NFC review cards", desc: "More tap-to-review cards for every register, table or counter.", status: "live", included: "addon", price: "$24.99 each" },
  { id: "ads", name: "Lokly Ads", desc: "Ads on Instagram, Facebook and Google, run and reported monthly.", status: "managed", included: "addon", price: "$149/mo + ad spend", cents: 14900, monthly: true },
];

export const STATUS_LABEL: Record<ToolStatus, string> = { live: "Live", managed: "Done for you", soon: "Coming soon" };
export const toolById = (id: string) => MARKETING_TOOLS.find(t => t.id === id);
