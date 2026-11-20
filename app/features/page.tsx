import { MARKETING_TOOLS, STATUS_LABEL } from "@/lib/tools";
export const metadata = { title: "Features | Lokly", description: "Website, Google Business Profile management, reviews, social posting, email and text campaigns, postcards and ads for local businesses, in one place." };
const GROUPS: { title: string; sub: string; items: [string, string, string][] }[] = [
  { title: "Get found", sub: "Show up when people nearby search.", items: [
    ["Google profile management", "Categories, services, hours, photos and description tuned to what customers search. Posts every week.", "From $25/mo"],
    ["Website that ranks", "A fast, mobile-first site built from your Google profile, with local SEO and structured data Google and AI assistants read.", "$299 + 3 months free"],
    ["AI search visibility", "Your business described the same way everywhere, so ChatGPT, Google AI and Maps recommend you.", "Included"],
    ["Listings everywhere", "Same name, address and phone on Apple Maps, Bing, Yelp and Facebook.", "Included in Pro"],
  ] },
  { title: "Win the customer", sub: "Turn a search into a call, visit or order.", items: [
    ["Call, order and book buttons", "Every post and profile set up with the right button for your business.", "Included"],
    ["Review booster", "Tap-to-review NFC card, QR code and text link. More 5★ reviews, faster.", "Free card included"],
    ["Free Google report", "See your score and exactly what's holding you back, in a minute.", "Free"],
  ] },
  { title: "Bring them back", sub: "Keep regulars coming and fill slow days.", items: [
    ["Social posting", "Instagram, Facebook and TikTok posts made from your photos, offers and reviews.", "$49/mo"],
    ["Email & text campaigns", "Slow-day specials, win-backs and promos to your customer list.", "$39/mo"],
    ["Postcard mailers", "Postcards to homes near you with a tracked QR code.", "From $349"],
    ["Lokly Ads", "Instagram, Facebook and Google ads, run and reported monthly.", "$149/mo + ad spend"],
  ] },
  { title: "See what's working", sub: "Your numbers on your phone, any time.", items: [
    ["Results app", "Views, calls, directions and reviews, with the wins up top. Add it to your home screen.", "Included"],
    ["Monthly results email", "What we did and what changed, in plain English.", "Included"],
  ] },
];
export default function Features() {
  return (
    <main>
      <section className="wrap sc-hero">
        <h1 className="sh-title sm">Everything a local business needs to grow. One place, one bill.</h1>
        <p className="sh-lead">Most owners juggle a website builder, an SEO agency, a review tool, a social scheduler and an ads person. Lokly does all of it for less than most of them charge alone.</p>
        <p><a className="btn dark" href="/grader">Get my free report</a> <a className="btn ghost" href="/compare" style={{ width: "auto" }}>Compare</a></p>
      </section>
      {GROUPS.map(g => (
        <section key={g.title} className="wrap sc-group">
          <h2 className="sh-h2">{g.title}</h2><p className="sh-sub">{g.sub}</p>
          <div className="sc-feats">{g.items.map(([n, d, p]) => <div key={n} className="card sc-feat"><h3>{n}</h3><p>{d}</p><span>{p}</span></div>)}</div>
        </section>
      ))}
      <section className="wrap sc-group"><h2 className="sh-h2">Coming soon</h2>
        <div className="sc-feats">{MARKETING_TOOLS.filter(t => t.status === "soon").map(t => <div key={t.id} className="card sc-feat"><h3>{t.name}</h3><p>{t.desc}</p><span>{STATUS_LABEL[t.status]}</span></div>)}</div></section>
      <section className="sh-end"><div className="wrap"><h2 className="sh-h2">Start with your free report.</h2><p className="sh-lead">See your Google score and the exact fixes, then pick what you need.</p><a className="btn lime" href="/grader">Get my free report</a></div></section>
    </main>
  );
}
