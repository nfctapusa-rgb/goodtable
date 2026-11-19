import { PlanCards } from "../plancards";

export const metadata = { title: "Pricing | Lokly", description: "Lokly pricing: a $150 website built to rank, $49.99/mo Google profile management, or $99/mo Lokly Pro." };

const FAQ = [
  ["What's the difference between the plans?", "Lokly Site is a one-time $150 website built for local search. Lokly Local ($49.99/mo) is us running your Google Business Profile: review replies, posts, offers and photos. Lokly Pro ($99/mo) includes everything in Local plus your website, online ordering and growth tools."],
  ["Is there a contract?", "No. Monthly plans are month-to-month and you can cancel anytime."],
  ["How does online ordering work on Pro?", "You choose. Link your existing DoorDash or Uber Eats pages for no extra fee, or connect your point-of-sale so customers order directly on your site. Direct online orders through your POS carry a 5% Lokly fee; there's no fee on orders placed through DoorDash or Uber Eats links."],
  ["Do I need Lokly Site if I'm on Pro?", "No. Your website is included with Lokly Pro."],
  ["Who replies to my reviews?", "Our team writes a personal reply to every Google review, in your voice, and follows the guidelines you set."],
  ["Can you guarantee I'll rank #1?", "No one can honestly guarantee Google rankings, and we don't. Google decides rankings. We do the work that helps: an active, accurate profile, review replies, and a site built with local SEO best practices."],
  ["Does it work for my type of business?", "Lokly works for any local business: restaurants, salons, auto shops, retail, home services, fitness, professional services and more."],
];

export default function Pricing() {
  return (
    <>
      <section className="hero2">
        <div className="wrap center">
          <h1 className="display">Get found. Get customers. Grow locally.</h1>
          <p className="lead">Simple pricing for any local business. No contracts.</p>
          <PlanCards />
          <p className="tiny muted" style={{ marginTop: 16 }}>Card processing billed by Stripe at standard rates · Monthly plans cancel anytime</p>
        </div>
      </section>
      <section className="wrap sec narrow">
        <h2 className="h2 center">Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p className="muted">{a}</p></details>)}
      </section>
      <section className="cta-band">
        <div className="wrap center">
          <h2 className="h2">See where you rank, free.</h2>
          <a href="/grader" className="btn lime lg">Get my free report ↗</a>
        </div>
      </section>
    </>
  );
}
