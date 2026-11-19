import { SearchHero } from "./ui";
import { Rotator } from "./rotator";

const INDUSTRIES = ["Restaurants", "Salons & barbers", "Retail & ecommerce", "Home services", "Fitness studios", "Auto shops", "Jewelers", "Med spas & wellness", "Contractors", "Transportation", "Consultants", "Creators & courses"];

const STEPS = [
  ["01", "Show up at the top of Google", "A website and Google profile tuned to rank for what customers search in your area."],
  ["02", "Turn visitors into customers", "Online ordering, booking, checkout and quotes built in, with no third-party commission."],
  ["03", "Bring customers back", "Your own customer database, loyalty rewards and a branded app experience."],
  ["04", "Market on autopilot", "Email and text campaigns that run themselves: welcome, win-back, reviews and reminders."],
];

export default function Home() {
  return (
    <>
      <section className="hero2">
        <div className="wrap center">
          <p className="pill">Free AI visibility report · 60 seconds</p>
          <h1 className="display">The AI platform any business uses to <Rotator /></h1>
          <p className="lead">Search your business and see exactly how you show up on Google, your website and local search, plus what to fix first.</p>
          <SearchHero />
          <div className="phone">
            <div className="screen">
              <p className="tiny muted">Example report</p>
              <h3>Here's what's holding your business back on Google:</h3>
              {[
                ["Not ranking in nearby areas", "Missing local keywords that competitors are winning with."],
                ["Title missing primary keyword", "Adding “Barber in Downtown LA” helps Google match local searches."],
                ["Images missing alt tags", "Alt text boosts visibility on Google Maps and Google Images."],
                ["Sending customers to third-party apps", "Booking through someone else costs fees and the customer relationship."],
              ].map(([t, d]) => <div key={t} className="issue"><i>!</i><span>{t}<small>{d}</small></span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="eyebrow center">Built for every kind of local and online business</p>
          <div className="chips">{INDUSTRIES.map(i => <span key={i}>{i}</span>)}</div>
        </div>
      </section>

      <section className="wrap sec">
        <h2 className="h2">One platform. Your whole online business.</h2>
        <p className="lead">GoodTable replaces the website builder, booking app, ordering service, CRM and marketing tools you're paying for separately.</p>
        <div className="grid4">
          {STEPS.map(([n, t, d]) => <div key={n} className="card step"><span className="num">{n}</span><h3>{t}</h3><p className="muted">{d}</p></div>)}
        </div>
        <a href="/how-it-works" className="link">See how it works →</a>
      </section>

      <section className="wrap sec split">
        <div>
          <h2 className="h2">Built for your industry, not forced into a template.</h2>
          <p className="lead">Tell us what you do and GoodTable sets up the right tools automatically.</p>
          <ul className="ticks">
            <li><b>Restaurants:</b> menus, pickup and delivery, catering, QR ordering</li>
            <li><b>Appointments:</b> staff calendars, deposits, reminders, no-show protection</li>
            <li><b>Retail & ecommerce:</b> catalog, inventory, shipping, abandoned-cart recovery</li>
            <li><b>Services:</b> quote requests, estimates, invoices, client portal</li>
          </ul>
        </div>
        <div className="card dark price-teaser">
          <p className="eyebrow lime-t">GoodTable Growth</p>
          <div className="price"><b>$49.99</b><span>/month</span></div>
          <p className="muted">Every tool. No contracts. No commission on your sales.</p>
          <a href="/pricing" className="btn lime wide">See pricing</a>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap center">
          <h2 className="h2">See how many customers you're missing.</h2>
          <SearchHero />
        </div>
      </section>
    </>
  );
}
