import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { type MenuData, defaultTheme } from "@/lib/menus";

export const dynamic = "force-dynamic";
async function load(slug: string) {
  const sql = await db();
  const [m] = await sql`SELECT * FROM menus WHERE slug = ${slug} AND published` as any[];
  return m ?? null;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = await load((await params).slug);
  if (!m) return { title: "Menu | Lokly" };
  const d = m.data as MenuData;
  return { title: `${m.name} Menu${m.city ? ` · ${m.city}` : ""}`, description: d.about || `See the ${m.name} menu, prices and specials${m.city ? ` in ${m.city}` : ""}.`,
    openGraph: { title: `${m.name} Menu`, images: m.banner?.startsWith("https") ? [m.banner] : undefined } };
}
export default async function Menu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await load(slug);
  if (!m) notFound();
  const sql = await db();
  await sql`UPDATE menus SET views = views + 1 WHERE id = ${m.id}`.catch(() => null);
  const d = m.data as MenuData;
  const tel = m.phone ? `tel:${String(m.phone).replace(/[^\d+]/g, "")}` : null;
  const maps = m.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.name} ${m.address}`)}` : null;
  const ld = { "@context": "https://schema.org", "@type": m.kind === "bar" ? "BarOrPub" : "Restaurant", name: m.name, telephone: m.phone || undefined, address: m.address || undefined,
    url: `https://lokly.pro/m/${slug}`, hasMenu: { "@type": "Menu", hasMenuSection: d.sections.map(s => ({ "@type": "MenuSection", name: s.name,
      hasMenuItem: s.items.map(i => ({ "@type": "MenuItem", name: i.name, description: i.desc || undefined, offers: i.price ? { "@type": "Offer", price: i.price.replace(/[^\d.]/g, "") || undefined, priceCurrency: "USD" } : undefined })) })) } };
  return (
    <main className={`mn t-${m.theme || defaultTheme(m.kind)}`} style={{ ["--mc" as any]: m.color || "#E30A23" }}>
      <header className="mn-hero" style={m.banner ? { backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55)),url("${m.banner}")` } : undefined}>
        {m.logo && <img className="mn-logo" src={m.logo} alt={`${m.name} logo`} />}
        <h1>{m.name}</h1>
        {(m.city || m.address) && <p>{m.address || m.city}</p>}
      </header>
      <nav className="mn-actions">
        {tel && <a href={tel}>Call</a>}
        {maps && <a href={maps} target="_blank" rel="noreferrer">Directions</a>}
        {d.order && <a href={d.order} target="_blank" rel="noreferrer" className="on">Order</a>}
        {m.website && <a href={m.website} target="_blank" rel="noreferrer">Website</a>}
      </nav>
      {d.specials.length > 0 && <section className="mn-specials"><h2>Specials & events</h2>{d.specials.map((x, i) => <div key={i}><b>{x.title}</b>{x.when && <small>{x.when}</small>}{x.desc && <p>{x.desc}</p>}</div>)}</section>}
      {d.sections.length > 1 && <nav className="mn-jump">{d.sections.map((s, i) => <a key={i} href={`#s${i}`}>{s.name}</a>)}</nav>}
      {d.sections.map((s, i) => (
        <section key={i} id={`s${i}`} className="mn-sec"><h2>{s.name}</h2>
          {s.items.map((it, j) => (
            <div key={j} className={`mn-item ${it.photo ? "ph" : ""}`}>
              <div><div className="mn-row"><b>{it.name}</b>{it.price && <span>{/^\d/.test(it.price) ? `$${it.price}` : it.price}</span>}</div>
                {it.desc && <p>{it.desc}</p>}{it.tags?.length ? <div className="mn-tags">{it.tags.map(t => <em key={t}>{t}</em>)}</div> : null}</div>
              {it.photo && <img src={it.photo} alt={it.name} loading="lazy" />}
            </div>))}
        </section>))}
      {(d.hours || d.about) && <section className="mn-sec">{d.about && <><h2>About</h2><p className="mn-about">{d.about}</p></>}{d.hours && <><h2>Hours</h2><p className="mn-about" style={{ whiteSpace: "pre-line" }}>{d.hours}</p></>}</section>}
      <footer className="mn-foot"><a href="/menu">Free digital menu by <b>Lokly</b></a></footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </main>
  );
}
