import { INDUSTRIES, casesFor } from "@/lib/showcase";
export const metadata = { title: "Industries | Lokly", description: "Google profile, website and marketing tools for restaurants, barbers, salons, jewelers and local service businesses." };
export default function Industries() {
  return (
    <main className="sc-hero"><div className="wrap">
      <h1 className="sh-title sm">Built for the businesses on your block.</h1>
      <p className="sh-lead">Pick your business type to see what customers search for, what we fix, and real results from businesses like yours.</p>
      <div className="sc-inds">{Object.entries(INDUSTRIES).map(([k, v]) => {
        const c = casesFor(k)[0];
        return <a key={k} href={`/industries/${k}`} className="sc-ind"><b>{v.name}</b><span>{v.plural}</span>{c && <em>{c.headline[0]} {c.headline[1]}</em>}</a>;
      })}</div>
    </div></main>
  );
}
