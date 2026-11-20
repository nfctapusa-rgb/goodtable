import { SearchHero } from "@/app/ui";
// Spanish and Korean landing pages for LA's Latino and Koreatown business owners.
export type LangCopy = { lang: string; title: string; lead: string; cta: string; note: string; whatH: string; what: [string, string][];
  menuH: string; menuP: string; menuCta: string; priceH: string; prices: [string, string][]; proofH: string; proof: string[]; contactH: string; contactP: string };

export function LangLanding({ c }: { c: LangCopy }) {
  return (
    <main lang={c.lang}>
      <section className="sc-hero"><div className="wrap">
        <h1 className="sh-title sm">{c.title}</h1>
        <p className="sh-lead">{c.lead}</p>
        <SearchHero cta={c.cta} />
        <p className="sh-note">{c.note}</p>
      </div></section>
      <section className="wrap sc-group"><h2 className="sh-h2">{c.whatH}</h2>
        <div className="sc-feats">{c.what.map(([h, p]) => <div key={h} className="card sc-feat"><h3>{h}</h3><p>{p}</p></div>)}</div></section>
      <section className="wrap sc-group"><div className="card sc-feat" style={{ border: "2px solid var(--ink)" }}>
        <h2 style={{ margin: "0 0 8px" }}>{c.menuH}</h2><p>{c.menuP}</p><p><a className="btn dark" href="/menu">{c.menuCta}</a></p></div></section>
      <section className="wrap sc-group"><h2 className="sh-h2">{c.priceH}</h2>
        <div className="sc-price">{c.prices.map(([a, b]) => <div key={b}><b>{a}</b><span>{b}</span></div>)}</div></section>
      <section className="wrap sc-group"><h2 className="sh-h2">{c.proofH}</h2><ul className="sc-check">{c.proof.map(x => <li key={x}>{x}</li>)}</ul></section>
      <section className="sh-end"><div className="wrap"><h2 className="sh-h2">{c.contactH}</h2><p className="sh-lead">{c.contactP}</p><SearchHero cta={c.cta} /></div></section>
    </main>
  );
}
