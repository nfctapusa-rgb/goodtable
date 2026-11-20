import { notFound } from "next/navigation";
import { POSTS, postBySlug } from "@/lib/blog";
import { SearchHero } from "../../ui";
export const dynamicParams = false;
export function generateStaticParams() { return POSTS.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = postBySlug((await params).slug);
  return p ? { title: `${p.title} | Lokly`, description: p.desc, openGraph: { title: p.title, description: p.desc, type: "article" } } : {};
}
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const p = postBySlug((await params).slug); if (!p) notFound();
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.desc, datePublished: p.date,
    author: { "@type": "Organization", name: "Lokly" }, publisher: { "@type": "Organization", name: "Lokly", url: "https://lokly.pro" } };
  const more = POSTS.filter(x => x.slug !== p.slug).slice(0, 3);
  return (
    <main>
      <article className="wrap bl-art">
        <p className="sc-crumb"><a href="/blog">Blog</a> / {p.tag}</p>
        <h1>{p.title}</h1>
        <p className="bl-lead">{p.desc}</p>
        {p.body.map((b, i) => b[0] === "h" ? <h2 key={i}>{b[1]}</h2> : b[0] === "p" ? <p key={i}>{b[1]}</p> : <ul key={i}>{b[1].map(x => <li key={x}>{x}</li>)}</ul>)}
        <div className="bl-cta"><b>See how your business scores.</b><p>Free Google report in about a minute. No sign-up.</p><SearchHero cta="Get my free report" /></div>
        <h2>Keep reading</h2>
        <div className="bl-list">{more.map(x => <a key={x.slug} href={`/blog/${x.slug}`} className="card bl-card"><span className="bl-tag">{x.tag}</span><h3>{x.title}</h3></a>)}</div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </main>
  );
}
