import { CASES, INDUSTRIES } from "@/lib/showcase";
import { CaseCard } from "./cases";
import { SearchHero } from "../ui";
export const metadata = { title: "Results | Lokly", description: "Real Google numbers from local businesses Lokly manages: views, calls, directions and reviews." };
export default function Results() {
  return (
    <main>
      <section className="sc-hero"><div className="wrap">
        <h1 className="sh-title sm">Real results from real local businesses.</h1>
        <p className="sh-lead">Every number below is Google's own data from a profile we manage. Owners asked us to keep their names private, so we show the business type and neighborhood.</p>
        <nav className="sc-chips">{Object.entries(INDUSTRIES).map(([k, v]) => <a key={k} href={`/industries/${k}`}>{v.name}</a>)}</nav>
      </div></section>
      <section className="wrap"><div className="res-grid sc-grid">{CASES.map(c => <CaseCard key={c.slug} c={c} />)}</div>
        <p className="sh-fine">Data: Google Business Profile performance, pulled November 2026. Past results don't guarantee future rankings, which Google decides.</p></section>
      <section className="sh-end"><div className="wrap"><h2 className="sh-h2">See where your business stands.</h2><p className="sh-lead">Free report in about a minute. We'll show you exactly what to fix.</p><SearchHero cta="Check my business" /></div></section>
    </main>
  );
}
