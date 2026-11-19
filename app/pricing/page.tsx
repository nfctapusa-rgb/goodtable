export const metadata = { title: "Pricing | GoodTable", description: "One simple plan for any business: $49.99/month, every tool included, no contracts." };

const INCLUDED = [
  ["AI-optimized website", "Built to rank on Google, with custom domain and SSL included."],
  ["Online sales & booking", "Ordering, appointments, checkout, quotes and deposits for your industry."],
  ["Google profile management", "Posts, photos, hours and review replies kept current."],
  ["Automated SEO pages", "Local landing pages that rank for the areas you serve."],
  ["Customer CRM", "Every customer, order, booking and conversation in one timeline."],
  ["Loyalty & rewards", "A points program that drives repeat business, like the big chains."],
  ["Email & SMS marketing", "Done-for-you campaigns and automations that send on their own."],
  ["Reviews & reputation", "Automatic review requests and AI-drafted responses you approve."],
  ["GoodTable AI assistant", "Ask about your sales and make changes in plain English."],
  ["Analytics", "Revenue, customers, traffic and rankings on one dashboard."],
  ["Setup & migration", "We move your site, products and customers over for you."],
  ["Real human support", "A team that knows your business, not a ticket queue."],
];

const FAQ = [
  ["Is there a contract?", "No. GoodTable is month-to-month and you can cancel anytime from your dashboard."],
  ["Do you take a cut of my sales?", "No. You pay $49.99/month and standard card processing through Stripe. GoodTable takes no commission on your orders or bookings."],
  ["Does it work for my type of business?", "GoodTable is built for any business that sells products or services: restaurants, salons, retail, home services, fitness, auto, professional services and more. We configure the tools for your industry."],
  ["What if I already have a website?", "We'll grade it for free and either migrate it onto GoodTable or rebuild it so it ranks and converts better."],
  ["How long does setup take?", "Most businesses are live within a week of starting."],
];

export default function Pricing() {
  return (
    <>
      <section className="hero2">
        <div className="wrap center">
          <h1 className="display">Simple pricing that fits any business.</h1>
          <p className="lead">Get the complete GoodTable platform. Month-to-month, no long-term contracts, no commission on your sales.</p>
          <div className="card plan solo">
            <p className="eyebrow lime-t">GoodTable Growth</p>
            <div className="price"><b>$49.99</b><span>/month</span></div>
            <p className="muted">Everything below, for one business location. Additional locations available.</p>
            <a href="/grader" className="btn lime wide">Start with a free report</a>
            <p className="tiny muted">Cancel anytime · Card processing billed by Stripe at standard rates</p>
          </div>
        </div>
      </section>
      <section className="wrap sec">
        <h2 className="h2 center">Included in your plan</h2>
        <div className="grid3">{INCLUDED.map(([t, d]) => <div key={t} className="card feat"><h3>{t}</h3><p className="muted">{d}</p></div>)}</div>
      </section>
      <section className="wrap sec">
        <h2 className="h2 center">Why businesses choose GoodTable</h2>
        <div className="grid3">
          <div className="card feat"><h3>Results over endless options</h3><p className="muted">You don't need 400 design settings. You need a system proven to get found and get paid. That's what we build.</p></div>
          <div className="card feat"><h3>Big-company tech for small businesses</h3><p className="muted">Corporations have whole teams on AI, SEO and retention. With GoodTable, you get the same capabilities for $49.99 a month.</p></div>
          <div className="card feat"><h3>We win when you grow</h3><p className="muted">No commissions and no lock-in. We only keep you as a customer by growing your business.</p></div>
        </div>
      </section>
      <section className="wrap sec narrow">
        <h2 className="h2 center">Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p className="muted">{a}</p></details>)}
      </section>
      <section className="cta-band">
        <div className="wrap center">
          <h2 className="h2">See what GoodTable would fix for you.</h2>
          <a href="/grader" className="btn lime lg">Get my free report ↗</a>
        </div>
      </section>
    </>
  );
}
