export const metadata = { title: "Lokly vs juggling 5 tools | Lokly", description: "One local marketing platform instead of a website builder, SEO agency, review tool, social scheduler and ads manager." };
const ROWS: [string, string][] = [
  ["Website built and hosted", "Website builder or designer"],
  ["Google profile run every week", "SEO or local listings agency"],
  ["Review cards and review link", "Review management software"],
  ["Instagram, Facebook and TikTok posts", "Social media scheduler or freelancer"],
  ["Email and text promos", "Email/SMS marketing tool"],
  ["Postcards to nearby homes", "Print and mail shop"],
  ["Ads on Instagram, Facebook and Google", "Ads agency"],
  ["One results app with all your numbers", "Five logins and five reports"],
];
export default function Compare() {
  return (
    <main className="sc-hero"><div className="wrap">
      <h1 className="sh-title sm">One Lokly instead of five tools.</h1>
      <p className="sh-lead">Big restaurant platforms and SEO agencies charge hundreds a month for one piece of this. Lokly bundles it for local businesses, starting at $25.</p>
      <div className="sc-cmp">
        <div className="sc-cmp-h"><span>What you need</span><span>Usually means paying for</span><span>With Lokly</span></div>
        {ROWS.map(([a, b]) => <div key={a}><b>{a}</b><span>{b}</span><span className="sc-yes">✓ Included or add-on</span></div>)}
      </div>
      <div className="sc-price">
        <div><b>$25/mo</b><span>Google management</span></div>
        <div><b>$299</b><span>Website + 3 months free</span></div>
        <div><b>$99/mo</b><span>Lokly Pro: everything</span></div>
      </div>
      <p className="sh-fine">No contracts. Cancel anytime. Rankings are decided by Google and never guaranteed.</p>
      <p><a className="btn dark" href="/grader">Get my free report</a> <a className="btn ghost" href="/pricing" style={{ width: "auto" }}>See pricing</a></p>
    </div></main>
  );
}
