import { SearchHero } from "../ui";

export const metadata = { title: "How Lokly works", description: "How Lokly helps any business get found, sell more and bring customers back." };

const STEPS = [
  { n: "01", t: "Show up at the top of Google", d: "We build you a website engineered to rank, sync your Google Business Profile, and create local pages for every area you serve.",
    pts: ["AI-built, mobile-first website", "Schema, sitemap and meta tags done for you", "Google profile posts, hours and photos kept current", "Local landing pages for each neighborhood or city"] },
  { n: "02", t: "Turn visitors into paying customers", d: "Whatever you sell, customers can buy it on your site in a few taps, and you keep the customer and the margin.",
    pts: ["Online ordering, booking, checkout or quote requests", "Apple Pay, Google Pay and cards through Stripe", "Upsells, deposits and abandoned-cart recovery", "No third-party commission"] },
  { n: "03", t: "Bring customers back again and again", d: "Every purchase builds your own customer list, so repeat business stops depending on someone else's app.",
    pts: ["Customer CRM with full purchase history", "Points-based loyalty and rewards", "Branded customer portal that installs on phones", "Reorder and rebook in one tap"] },
  { n: "04", t: "Market on autopilot", d: "Proven email and text campaigns go out on their own, so you get repeat sales without writing a word.",
    pts: ["Welcome, win-back and birthday automations", "Review requests after every visit or order", "Appointment and order reminders", "Lokly AI writes and schedules campaigns for you"] },
];

export default function HowItWorks() {
  return (
    <>
      <section className="hero2">
        <div className="wrap center">
          <h1 className="display">You could be getting a lot more customers online.</h1>
          <p className="lead">Lokly is the easiest way for any business to rank higher on Google, sell or book directly, and keep customers coming back. Here's how.</p>
          <a href="/grader" className="btn dark lg">Get my free report</a>
        </div>
      </section>
      <section className="wrap sec">
        {STEPS.map((s, i) => (
          <div key={s.n} className={`hw ${i % 2 ? "rev" : ""}`}>
            <div>
              <span className="num big">{s.n}</span>
              <h2 className="h2">{s.t}</h2>
              <p className="lead">{s.d}</p>
            </div>
            <ul className="card ticks">{s.pts.map(p => <li key={p}>{p}</li>)}</ul>
          </div>
        ))}
      </section>
      <section className="wrap sec">
        <h2 className="h2 center">Getting started takes one call.</h2>
        <div className="grid4">
          {[["Get your free report", "See exactly where you're losing customers."], ["Start your plan", "Website from $150, Google management from $49.99/mo."], ["We build it", "Site, Google profile, checkout and automations, done for you."], ["You grow", "Track sales, customers and rankings from one dashboard."]].map(([t, d], i) =>
            <div key={t} className="card step"><span className="num">{i + 1}</span><h3>{t}</h3><p className="muted">{d}</p></div>)}
        </div>
      </section>
      <section className="cta-band">
        <div className="wrap center">
          <h2 className="h2">The easiest way to grow your business online.</h2>
          <SearchHero />
        </div>
      </section>
    </>
  );
}
