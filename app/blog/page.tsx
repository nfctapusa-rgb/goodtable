import { POSTS } from "@/lib/blog";
export const metadata = { title: "Blog: local marketing guides | Lokly", description: "Plain-English guides to Google Business Profiles, reviews, websites and AI search for local business owners." };
export default function Blog() {
  return (
    <main className="sc-hero"><div className="wrap">
      <h1 className="sh-title sm">Guides for local business owners.</h1>
      <p className="sh-lead">Plain-English advice on getting found on Google, getting more reviews and turning searches into customers.</p>
      <div className="bl-list">{POSTS.map(p => (
        <a key={p.slug} href={`/blog/${p.slug}`} className="card bl-card"><span className="bl-tag">{p.tag}</span><h2>{p.title}</h2><p>{p.desc}</p></a>
      ))}</div>
    </div></main>
  );
}
