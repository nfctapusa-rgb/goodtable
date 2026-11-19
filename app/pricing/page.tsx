import { PlanCards } from "../plancards";
import { FEATURES, type Avail } from "@/lib/plans";

export const metadata = { title: "Pricing | Lokly", description: "Google Business Profile management $25/mo. Lokly Pro $89/mo with your website and marketing. Websites $150." };

const FAQ = [
  ["What do I have to do?", "Send us your website, Google profile and any ordering links, and approve your offers. We handle the rest. If something changes, like hours or a special, just text us."],
  ["Is there a contract?", "No. Monthly plans are month to month and you can cancel anytime."],
  ["How does online ordering work on Pro?", "Link your existing DoorDash, Uber Eats or booking page for no extra fee, or connect your point-of-sale so customers order directly on your site. Direct online orders through your POS carry a 5% Lokly fee."],
  ["Can you guarantee I'll rank #1?", "No one can honestly guarantee Google rankings, and we don't. Google decides rankings. We do the work that helps: an active, accurate profile, review replies, and a site built with local SEO best practices."],
  ["What does \"coming soon\" mean?", "Those tools are being built now. They'll be added to Pro at no extra cost when they launch, and you're not paying for them until then."],
  ["Does it work for my type of business?", "Yes. Restaurants, barbers and salons, jewelers, auto shops, retail, home services, fitness and more."],
];

const Mark = ({ v }: { v: Avail }) => v === "yes" ? <span className="fx yes" aria-label="Included">✓</span> : v === "soon" ? <span className="fx soon">Coming soon</span> : <span className="fx no" aria-label="Not included">–</span>;

export default function Pricing() {
  return (
    <>
      <section className="pr-hero">
        <div className="wrap">
          <h1 className="sh-title">One monthly price. We handle the marketing.</h1>
          <p className="sh-lead">Send us your links, and we run your Google profile, website and marketing. No contracts.</p>
          <PlanCards />
        </div>
      </section>

      <section className="wrap pr-how">
        <h2 className="sh-h2">How it works</h2>
        <ol className="steps3">
          <li><b>Send us your links</b><span>Your website, Google profile, ordering or booking links, and logo. Takes two minutes.</span></li>
          <li><b>We set it up</b><span>We optimize your profile and, on Pro, build your website. You approve before anything goes live.</span></li>
          <li><b>We run it every week</b><span>Reviews answered, posts and offers published, photos updated, and a report every month.</span></li>
        </ol>
      </section>

      <section className="wrap pr-table">
        <h2 className="sh-h2">What's included</h2>
        <div className="ftable" role="table" aria-label="Plan comparison">
          <div className="frow fhead" role="row"><span role="columnheader">Feature</span><span role="columnheader">Google Management<small>$25/mo</small></span><span role="columnheader">Lokly Pro<small>$89/mo</small></span></div>
          {FEATURES.map(g => (
            <div key={g.group} role="rowgroup">
              <div className="fgroup" role="row"><span role="cell">{g.group}</span></div>
              {g.rows.map(([t, d, a, b]) => (
                <div key={t} className="frow" role="row">
                  <span role="cell"><b>{t}</b><small>{d}</small></span>
                  <span role="cell"><Mark v={a} /></span>
                  <span role="cell"><Mark v={b} /></span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="sh-fine">Just need a site? A website on its own is $150 one-time, and you can add Google Management anytime.</p>
      </section>

      <section className="wrap narrow pr-faq">
        <h2 className="sh-h2">Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p className="muted">{a}</p></details>)}
      </section>

      <section className="sh-end">
        <div className="wrap">
          <h2 className="sh-title sm">See where you stand first.</h2>
          <p className="sh-lead">Get a free report on your Google profile and website in about a minute.</p>
          <a href="/grader" className="btn lime lg">Get my free report</a>
        </div>
      </section>
    </>
  );
}
