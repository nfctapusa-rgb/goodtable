// Anonymized results from Lokly-managed Google Business Profiles (Google data via LeadSnap, pulled Nov 20 2026).
// Owners asked us to keep names private: label by business type and area only. Every number is real.
export type Case = { slug: string; industry: string; label: string; area: string; headline: [string, string];
  months: [string, number][]; facts: string[]; did: string[] };

export const CASES: Case[] = [
  { slug: "teppanyaki-dtla", industry: "restaurants", label: "Teppanyaki restaurant", area: "Downtown LA",
    headline: ["+38%", "Google views over 6 months"],
    months: [["May", 8258], ["Jun", 7685], ["Jul", 8540], ["Aug", 9171], ["Sep", 9025], ["Oct", 14201]],
    facts: ["60,554 Google views in 6 months", "+34% calls, website visits and directions", "5.0★ across 175 reviews"],
    did: ["Profile rebuilt around \"hibachi\" and \"teppanyaki\" searches", "Posts every 3 days with offers", "Every review answered"] },
  { slug: "hibachi-inland-empire", industry: "restaurants", label: "Hibachi takeout", area: "Inland Empire",
    headline: ["+44%", "Google views over 6 months"],
    months: [["May", 1464], ["Jun", 1223], ["Jul", 1100], ["Aug", 1284], ["Sep", 1781], ["Oct", 4125]],
    facts: ["+38% calls from Google in the last 30 days", "+43% calls, website visits and directions in 30 days", "4.9★ across 32 reviews"],
    did: ["Second location set up with its own offers", "Weekly posts with a Call button", "Menu and order links fixed"] },
  { slug: "barbershop-dtla", industry: "barbers-salons", label: "Barbershop", area: "Downtown LA",
    headline: ["+53%", "calls from Google over 6 months"],
    months: [["May", 2191], ["Jun", 2025], ["Jul", 2447], ["Aug", 2858], ["Sep", 3210], ["Oct", 2036]],
    facts: ["240 phone calls straight from Google in 6 months", "+46% calls, bookings clicks and directions", "4.7★ across 105 reviews"],
    did: ["Weekly specials posted (Monday deal, military discount)", "Booking link added to the profile", "Hours kept accurate for holidays"] },
  { slug: "pizza-dtla", industry: "restaurants", label: "Family pizza & Armenian kitchen", area: "Downtown LA",
    headline: ["9x", "people searching the restaurant by name"],
    months: [["May", 6253], ["Jun", 6661], ["Jul", 8124], ["Aug", 8667], ["Sep", 5001], ["Oct", 7076]],
    facts: ["41,533 Google views in 6 months", "Website clicks from Google went from 5 to 124", "+17% calls, website visits and directions"],
    did: ["Description rewritten around breakfast, pizza and Armenian plates", "New website linked from Google", "Twice-weekly posts with a Call button"] },
  { slug: "jewelry-repair-dtla", industry: "jewelers", label: "Jewelry repair shop", area: "Downtown LA Jewelry District",
    headline: ["20x", "Google views vs the 6 months before"],
    months: [["May", 57], ["Jun", 59], ["Jul", 88], ["Aug", 108], ["Sep", 134], ["Oct", 111]],
    facts: ["From 30 to 617 Google views in 6 months", "295 customer actions, up from 8", "5.0★ reviews"],
    did: ["Profile built from scratch with services and prices", "New website with ring catalog", "Blog-style posts every 3 days"] },
  { slug: "recording-studio-tempe", industry: "studios-services", label: "Recording studio", area: "Tempe, AZ",
    headline: ["+18%", "calls, website visits and directions over 6 months"],
    months: [["May", 64], ["Jun", 60], ["Jul", 78], ["Aug", 58], ["Sep", 60], ["Oct", 85]],
    facts: ["October was the best month on Google", "First phone calls from Google started coming in", "5.0★ reviews"],
    did: ["Category and services set up for recording and mixing", "Posts aimed at artists searching nearby", "Photos of the live room added"] },
];

export const INDUSTRIES: Record<string, { name: string; plural: string; pain: string; searches: string[]; wins: string[] }> = {
  restaurants: { name: "Restaurants", plural: "restaurants, cafés and takeout spots",
    pain: "Hungry people decide in seconds on Google Maps. If your photos are old, your hours are wrong or your rating is unanswered, they pick the place next door.",
    searches: ["pizza near me", "breakfast downtown", "hibachi takeout", "lunch open now"],
    wins: ["Menu, hours and order links that are always right", "Posts with a Call or Order button twice a week", "More 5★ reviews with a tap card at the counter", "A fast website with your real menu"] },
  "barbers-salons": { name: "Barbers & salons", plural: "barbershops, salons and spas",
    pain: "New clients search \"barber near me\" and book whoever looks busiest and best-reviewed. A booking button and fresh photos win the chair.",
    searches: ["barber near me", "fade haircut", "salon open Sunday", "walk-in haircut"],
    wins: ["Book button on Google that goes straight to your calendar", "Weekly specials (slow-day deals, discounts) posted for you", "Before-and-after photos that keep your profile active", "Review cards that turn happy clients into 5★"] },
  jewelers: { name: "Jewelers", plural: "jewelers, jewelry repair and watch shops",
    pain: "Ring and repair shoppers compare trust first. Reviews, real photos and clear services decide who gets the walk-in.",
    searches: ["ring resizing near me", "engagement rings", "jewelry repair", "watch battery replacement"],
    wins: ["Every service listed with prices so you show up for each search", "Catalog-style website", "Posts about repairs, custom work and seasons", "Trust signals: reviews, photos, years in business"] },
  "studios-services": { name: "Studios & services", plural: "studios, shops and service businesses",
    pain: "If Google doesn't understand what you do, it doesn't show you. The right categories and services decide whether you appear at all.",
    searches: ["recording studio near me", "auto repair open now", "photographer nearby", "transportation service"],
    wins: ["Categories and services set up so Google knows what you do", "A website that turns searches into calls", "Posts aimed at the people searching nearby", "Monthly numbers so you see what's working"] },
};
export const casesFor = (ind: string) => CASES.filter(c => c.industry === ind);
