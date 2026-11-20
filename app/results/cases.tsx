import type { Case } from "@/lib/showcase";
export function CaseCard({ c }: { c: Case }) {
  const max = Math.max(...c.months.map(m => m[1]));
  const best = c.months.reduce((a, b) => (b[1] > a[1] ? b : a));
  return (
    <article className="res sc-case">
      <p className="res-kind">{c.label} · {c.area}</p>
      <p className="res-big"><b>{c.headline[0]}</b> <span>{c.headline[1]}</span></p>
      <div className="res-bars" aria-label={`Monthly Google views: ${c.months.map(([m, v]) => `${m} ${v.toLocaleString()}`).join(", ")}`}>
        {c.months.map(([m, v]) => <div key={m}><i style={{ height: `${Math.max(4, (v / max) * 100)}%` }} className={m === best[0] ? "on" : ""} /><small>{m}</small></div>)}
      </div>
      <ul className="res-facts">{c.facts.map(f => <li key={f}>{f}</li>)}</ul>
      <details className="sc-did"><summary>What we did</summary><ul>{c.did.map(d => <li key={d}>{d}</li>)}</ul></details>
    </article>
  );
}
