import { SearchHero } from "./ui";

const CLIENTS = [
  ["Flamebachi", "Hibachi · Downtown LA & Jurupa Valley"],
  ["Clarity & Cut", "Barbershop · Downtown LA"],
  ["Corleone Pizza", "Pizza · Downtown LA"],
  ["Julio's Jewelry Repair", "Jewelry repair · Downtown LA"],
  ["Gold & Diamond Jewelers", "Jeweler · Costa Mesa"],
  ["Jewels by Chris", "Fine rings"],
  ["CU Transportation", "Chauffeur vans · Los Angeles"],
];

const WEEK = [
  ["Mon", "Weekly offer goes live", "“$10 off Mondays” posted to Google"],
  ["Daily", "Every review answered", "Personal replies, in your voice"],
  ["Wed", "Fresh photos", "New shots keep your profile active"],
  ["Fri", "Weekend post", "Hours, specials, what's new"],
  ["Monthly", "Your report", "Calls, direction requests, rank"],
];

export default function Home() {
  return (
    <>
      <section className="h3ro">
        <div className="wrap h3grid">
          <div>
            <p className="kicker">Downtown LA · Local SEO & Google profiles</p>
            <h1 className="mega">When someone nearby searches for what you sell, <span className="hl">help them find you.</span></h1>
            <p className="lead l">We build your website, run your Google Business Profile every week, and answer every review, so the customers walking past your block find you instead of the place next door.</p>
            <SearchHero cta="Check my business free" />
            <p className="tiny muted">Free report in about a minute. No sign-up.</p>
          </div>
          <div className="gcard" aria-label="Example of a Google profile we manage">
            <p className="tiny muted">Example only: the kind of activity we keep on your profile</p>
            <div className="gtop"><b>Example Business</b><span className="gstars">★★★★★ <em>4.9</em></span><span className="gmeta">Open now · Closes 11 PM</span></div>
            <div className="gbtns"><span>Order</span><span>Call</span><span>Directions</span></div>
            <div className="gpost"><span className="gtag">Offer</span><b>10% off all bowls until 4 PM</b><small>Posted Monday by Lokly</small></div>
            <div className="greview"><p>“Example review from a customer.”</p><div className="greply"><b>Owner reply</b><span>Thank you! We'll have your usual ready next time. 🙏</span></div></div>
          </div>
        </div>
      </section>

      <section className="strip">
        <div className="wrap">
          <p className="kicker dim">Local businesses we already work with</p>
          <div className="clients">{CLIENTS.map(([n, d]) => <div key={n}><b>{n}</b><span>{d}</span></div>)}</div>
        </div>
      </section>

      <section className="wrap case">
        <div>
          <p className="kicker">Case study</p>
          <h2 className="big">Flamebachi: two locations, one system.</h2>
          <p className="lead l">We built <a href="https://flamebachi.com" target="_blank" rel="noreferrer">flamebachi.com</a> and run the Google profiles for both the Downtown LA and Jurupa Valley locations: offers posted on a schedule, every review answered, photos kept fresh, and an Order Now button on every page.</p>
          <div className="stats">
            <div><b>4.9★</b><span>on Google</span></div>
            <div><b>150+</b><span>reviews</span></div>
            <div><b>2</b><span>locations managed</span></div>
          </div>
          <a className="link" href="https://flamebachi.com" target="_blank" rel="noreferrer">See the live site →</a>
        </div>
        <div className="mock">
          <div className="mockbar"><i /><i /><i /><span>flamebachi.com</span></div>
          <div className="mockhero">
            <p>FRESH • MADE TO ORDER • HIBACHI</p>
            <h3>Good Frequency Energy.<br />Fresh off the grill.</h3>
            <div><span>Order Online</span><span className="o">View the Menu</span></div>
          </div>
          <div className="mockoffer"><small>EVERY DAY UNTIL 4 PM</small><b>10% OFF ALL BACHI BOWLS + FREE SODA</b></div>
        </div>
      </section>

      <section className="wrap weekly">
        <div className="wk-head">
          <p className="kicker">Lokly Local · $25/mo</p>
          <h2 className="big">What we do on your Google profile, every week.</h2>
          <p className="lead l">You run the business. We keep your profile active, because active, accurate profiles tend to perform better on Google.</p>
        </div>
        <ol className="week">{WEEK.map(([d, t, s]) => <li key={t}><span className="day">{d}</span><b>{t}</b><small>{s}</small></li>)}</ol>
      </section>

      <section className="wrap tiers">
        <h2 className="big c">Three ways to work with us.</h2>
        <div className="tgrid">
          <div className="tier"><span className="tp">$150</span><span className="tu">one-time</span><h3>Website</h3><p>A fast site built for local search: the right titles, descriptions, schema and local keywords from day one.</p></div>
          <div className="tier dark"><span className="tp">$25</span><span className="tu">per month</span><h3>Google profile management</h3><p>Review replies, daily and weekly posts, offers and photos, done for you.</p></div>
          <div className="tier"><span className="tp">$89</span><span className="tu">per month</span><h3>Lokly Pro</h3><p>Everything above plus your website hosted, online ordering, and growth tools.</p></div>
        </div>
        <div className="c"><a href="/pricing" className="link">Compare plans →</a></div>
      </section>

      <section className="wrap human">
        <div>
          <h2 className="big">We're local. We'll come to you.</h2>
          <p className="lead l">No call centers and no 40-page contracts. We meet you at your shop, set everything up, and you can text us when something changes, like new hours, a new special or a holiday closure.</p>
        </div>
        <ul className="promises">
          <li><b>Month to month</b><span>Cancel anytime.</span></li>
          <li><b>You own it</b><span>Your domain, your profile, your customers.</span></li>
          <li><b>You approve offers</b><span>Nothing goes out you didn't OK.</span></li>
        </ul>
      </section>

      <section className="final">
        <div className="wrap c">
          <h2 className="big">See where you rank on your block.</h2>
          <p className="lead l c">Type your business name and get your free report in about a minute.</p>
          <SearchHero cta="Check my business free" />
        </div>
      </section>
    </>
  );
}
