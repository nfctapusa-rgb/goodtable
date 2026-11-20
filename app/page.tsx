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

// Anonymized results from Google Business Profile data (pulled Nov 2026).
const RESULTS: { label: string; jump: number; months: [string, number][]; facts: string[] }[] = [
  { label: "Hibachi takeout, Inland Empire", jump: 132,
    months: [["May", 1464], ["Jun", 1223], ["Jul", 1100], ["Aug", 1284], ["Sep", 1781], ["Oct", 4125]],
    facts: ["Calls from Google up 22% in the last 30 days", "Calls, website visits and directions up 37%", "4.9 stars"] },
  { label: "Teppanyaki takeout, Downtown LA", jump: 57,
    months: [["May", 8258], ["Jun", 7685], ["Jul", 8540], ["Aug", 9171], ["Sep", 9025], ["Oct", 14201]],
    facts: ["15,189 Google views in the last 30 days", "Calls, website visits and directions up 15%", "5.0 stars across 170+ reviews"] },
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

      <section className="wrap sh-results">
        <h2 className="sh-h2">Real numbers from shops we manage.</h2>
        <p className="sh-sub">Google's own data for two takeout locations we took over in mid-October. Owners asked us to keep their names private. <a href="/results">See all results</a>.</p>
        <div className="res-grid">
          {RESULTS.map(r => (
            <article key={r.label} className="res">
              <p className="res-kind">{r.label}</p>
              <p className="res-big"><b>+{r.jump}%</b> <span>Google views, September to October</span></p>
              <div className="res-bars" aria-label={`Monthly Google views: ${r.months.map(([m, v]) => `${m} ${v.toLocaleString()}`).join(", ")}`}>
                {r.months.map(([m, v]) => <div key={m}><i style={{ height: `${(v / Math.max(...r.months.map(x => x[1]))) * 100}%` }} className={m === "Oct" ? "on" : ""} /><small>{m}</small></div>)}
              </div>
              <ul className="res-facts">{r.facts.map(f => <li key={f}>{f}</li>)}</ul>
            </article>
          ))}
        </div>
        <p className="sh-fine">Source: Google Business Profile performance data. Every business is different and Google decides rankings, so we can't promise the same results.</p>
      </section>

      <section className="sh-week">
        <div className="wrap">
          <h2 className="sh-h2">A week on your Google profile.</h2>
          <p className="sh-sub">This is the Google Management plan. You keep running the shop; we keep your profile active and accurate.</p>
          <ol className="cal">
            {WEEK.map(([d, t]) => <li key={d}><b>{d}</b><span>{t}</span></li>)}
          </ol>
        </div>
      </section>

      <section className="wrap sh-plans">
        <h2 className="sh-h2">Pick what you need.</h2>
        <dl className="menu">
          
          <div><dt>Google management</dt><dd className="pr">$25 a month <s>$29</s></dd><dd className="ds">Review replies, weekly posts and offers, fresh photos, and a monthly email with your numbers. <b>Free NFC review card</b> for your counter.</dd></div>
          <div className="pop"><dt>Website package</dt><dd className="pr">$299 once</dd><dd className="ds"><span className="tag">Most shops start here</span> We build your site and optimize your Google profile. <b>3 months of management free</b>, then $39 a month for management, hosting and up to 3 changes a week.</dd></div>
          <div><dt>Lokly Pro</dt><dd className="pr">$99 a month</dd><dd className="ds">Management plus your website, online ordering, a live analytics dashboard and our marketing tools.</dd></div>
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
