import { notFound } from "next/navigation";
import { INDUSTRIES, casesFor } from "@/lib/showcase";
import { CaseCard } from "../../results/cases";
import { SearchHero } from "../../ui";
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(INDUSTRIES).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const i = INDUSTRIES[slug];
  return { title: `${i?.name ?? "Industries"} | Lokly`, description: i ? `Google profile management, websites and marketing for ${i.plural}. ${i.pain}` : undefined };
}
export default async function Industry({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const i = INDUSTRIES[slug]; if (!i) notFound();
  const cases = casesFor(slug);
  return (
    <main>
      <section className="sc-hero"><div className="wrap">
        <p className="sc-crumb"><a href="/industries">Industries</a> / {i.name}</p>
        <h1 className="sh-title sm">More customers for {i.plural}.</h1>
        <p className="sh-lead">{i.pain}</p>
        <SearchHero cta="Check my business" />
      </div></section>
      <section className="wrap sc-two">
        <div className="card"><h2>What your customers search</h2><ul className="sc-searches">{i.searches.map(s => <li key={s}>“{s}”</li>)}</ul></div>
        <div className="card"><h2>What we handle for you</h2><ul className="sc-check">{i.wins.map(w => <li key={w}>{w}</li>)}</ul></div>
      </section>
      {cases.length > 0 && <section className="wrap"><h2 className="sh-h2">Results from {i.name.toLowerCase()} we manage.</h2><div className="res-grid sc-grid">{cases.map(c => <CaseCard key={c.slug} c={c} />)}</div></section>}
      <section className="sh-end"><div className="wrap"><h2 className="sh-h2">Google management from $25/mo.</h2><p className="sh-lead">Website, Google profile, posts, reviews, social and ads in one place. <a href="/pricing" style={{ color: "#fff" }}>See pricing</a>.</p><SearchHero cta="Get my free report" /></div></section>
    </main>
  );
}
