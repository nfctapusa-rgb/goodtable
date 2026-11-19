import { SearchHero } from "./ui";

// Real Lokly clients, shown as storefronts on one block. Awning colors are
// ours, not their brand marks.
const BLOCK = [
  { name: "Fire Grill", kind: "Hibachi", awn: "#E5402F", sign: "#FFD23F", ink: "#142133" },
  { name: "Main St. Cuts", kind: "Barbershop", awn: "#142133", sign: "#FFFFFF", ink: "#142133" },
  { name: "Slice House", kind: "Pizza", awn: "#2F6B4F", sign: "#FFFFFF", ink: "#2F6B4F" },
  { name: "Your shop", kind: "Here", awn: "#FFD23F", sign: "#FFFFFF", ink: "#142133", you: true },
  { name: "Corner Jewelry", kind: "Jewelry repair", awn: "#22324A", sign: "#FFD23F", ink: "#142133" },
];

const WEEK: [string, string][] = [
  ["Mon", "Your weekly offer goes up on Google"],
  ["Tue", "New reviews get a personal reply"],
  ["Wed", "Fresh photos added to your profile"],
  ["Thu", "New reviews get a personal reply"],
  ["Fri", "Weekend post: hours, specials, what's new"],
  ["Sat", "New reviews get a personal reply"],
  ["Sun", "Quiet. Hours stay accurate."],
];

export default function Home() {
  return (
    <>
      <section className="sh-hero">
        <div className="wrap">
          <h1 className="sh-title">Get found by the people on your block.</h1>
          <p className="sh-lead">Lokly builds your website, runs your Google Business Profile every week, and answers every review. We're in Downtown LA and we come to you.</p>
          <SearchHero cta="Check my business" />
          <p className="sh-note">Free report in about a minute. No sign-up.</p>
        </div>
        <div className="street" aria-label="Storefronts of businesses that work with Lokly">
          <div className="block">
            {BLOCK.map(s => (
              <div key={s.name} className={`shop ${s.you ? "you" : ""}`} style={{ ["--awn" as string]: s.awn, ["--sign" as string]: s.sign, ["--sink" as string]: s.ink }}>
                {s.you && <span className="pin" aria-hidden="true" />}
                <div className="sign"><b>{s.name}</b></div>
                <div className="awning" aria-hidden="true" />
                <div className="front"><span className="window" /><span className="door" /><span className="window" /></div>
                <small>{s.kind}</small>
              </div>
            ))}
          </div>
          <div className="curb" aria-hidden="true" />
        </div>
      </section>

      <section className="wrap sh-case">
        <div className="sh-case-text">
          <h2 className="sh-h2">Example: a two-location grill. We run their Google.</h2>
          <p>Here's what that looks like for a takeout spot with two locations: we build the website and manage both Google profiles. Offers go out on a schedule, every review gets answered, and the photos stay current.</p>
          <a className="sh-link" href="/grader">See where your shop stands</a>
        </div>
        <figure className="sh-shot">
          <div className="sh-shot-hero">
            <p>Made to order.<br />Fresh off the grill.</p>
            <span>Order Online</span>
          </div>
          <div className="sh-shot-offer">10% off all bowls before 4 PM</div>
          <figcaption>Sample website built by Lokly</figcaption>
        </figure>
      </section>

      <section className="sh-week">
        <div className="wrap">
          <h2 className="sh-h2">A week on your Google profile.</h2>
          <p className="sh-sub">This is the $25/month plan. You keep running the shop; we keep your profile active and accurate.</p>
          <ol className="cal">
            {WEEK.map(([d, t]) => <li key={d}><b>{d}</b><span>{t}</span></li>)}
          </ol>
        </div>
      </section>

      <section className="wrap sh-plans">
        <h2 className="sh-h2">Pick what you need.</h2>
        <dl className="menu">
          <div><dt>Website</dt><dd className="pr">$150 once</dd><dd className="ds">A fast site with the right titles, descriptions and local keywords.</dd></div>
          <div className="pop"><dt>Google profile management</dt><dd className="pr">$25 a month</dd><dd className="ds">Review replies, weekly posts and offers, fresh photos.</dd></div>
          <div><dt>Lokly Pro</dt><dd className="pr">$89 a month</dd><dd className="ds">Profile management plus your website, hosted, with online ordering.</dd></div>
        </dl>
        <p className="sh-fine">Month to month. Cancel anytime. <a href="/pricing">See everything included</a></p>
      </section>

      <section className="sh-end">
        <div className="wrap">
          <h2 className="sh-title sm">We'll stop by.</h2>
          <p className="sh-lead">No call center and no long contract. We set everything up at your shop, and you can text us when your hours or specials change.</p>
          <SearchHero cta="Check my business" />
        </div>
      </section>
    </>
  );
}
