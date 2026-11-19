"use client";
import { useEffect, useState } from "react";
import { generateSite, type SiteModel } from "@/lib/sitegen";

// Hero fallback when the business has no Google photos yet.
const GRADIENT: Record<string, string> = {
  food: "radial-gradient(120% 90% at 70% 20%,#7a2e12 0%,#2a1209 45%,#0b0706 100%)",
  beauty: "radial-gradient(120% 90% at 70% 20%,#8a5a52 0%,#3a2523 50%,#120c0b 100%)",
  auto: "radial-gradient(120% 90% at 70% 20%,#1f4f8a 0%,#14263c 50%,#06090d 100%)",
  health: "radial-gradient(120% 90% at 70% 20%,#1f8a76 0%,#123a33 50%,#061210 100%)",
  fitness: "radial-gradient(120% 90% at 70% 20%,#5d7a1f 0%,#1f2a0d 50%,#070906 100%)",
  home: "radial-gradient(120% 90% at 70% 20%,#a8700a 0%,#3a2a0d 50%,#0d0a05 100%)",
  pro: "radial-gradient(120% 90% at 70% 20%,#3d4fbf 0%,#1a1f4a 50%,#07081a 100%)",
  retail: "radial-gradient(120% 90% at 70% 20%,#8f7344 0%,#3a2f1d 50%,#0f0c08 100%)",
  other: "radial-gradient(120% 90% at 70% 20%,#4a5160 0%,#1b2028 50%,#08090b 100%)",
};

export default function Preview() {
  const [m, setM] = useState<SiteModel | null>(null);
  const [view, setView] = useState<"mobile" | "desktop">("mobile");
  useEffect(() => {
    try {
      const r = JSON.parse(sessionStorage.getItem("lokly_report") || "null");
      if (r) setM(generateSite({ businessName: r.businessName, city: r.city, keyword: r.keyword, address: r.address, profile: r.profile }));
    } catch {}
  }, []);

  if (!m) return (
    <main className="narrow"><section className="hero"><h1>No report yet</h1>
      <p className="muted">Grade your business first and we'll build your website from it.</p>
      <a className="btn dark" href="/grader">Get my free report</a></section></main>
  );

  const heroBg = m.photos[0] ? `linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.65)),url("${m.photos[0]}") center/cover` : GRADIENT[m.industry];
  const word = m.name.toUpperCase();
  const split = Math.ceil(word.length / 2);

  return (
    <main className="pv">
      <div className="pvbar wrap">
        <div><p className="eyebrow">Your AI website · preview</p><h1 className="pvh">{m.name}</h1>
          <p className="muted small">Built from your Google profile, with every SEO issue from your report fixed. The offer and menu items are examples you can edit.</p></div>
        <div className="pvctl">
          <div className="seg"><button className={view === "mobile" ? "on" : ""} onClick={() => setView("mobile")}>Mobile</button>
            <button className={view === "desktop" ? "on" : ""} onClick={() => setView("desktop")}>Desktop</button></div>
          <a href="/start?plan=site" className="btn lime">Launch this site · $299</a>
        </div>
      </div>

      <div className={`frame ${view}`}>
        <div className="fb">
          <header className="fb-nav">
            <b className="fb-logo"><span>{word.slice(0, split)}</span><i>{word.slice(split)}</i></b>
            <a className="fb-pill dark">{m.cta}</a>
          </header>

          <section className="fb-hero" style={{ background: heroBg }}>
            <p className="fb-eyebrow">{m.eyebrow}</p>
            <h2>{m.headline}<br />{m.headline2}</h2>
            <p className="fb-sub">{m.sub}</p>
            <div className="fb-ctas"><a className="fb-pill light">{m.cta}</a><a className="fb-pill outline">{m.ctaSecondary}</a></div>
          </section>

          <section className="fb-offer">
            <p className="fb-eyebrow">{m.offer.when}</p>
            <h3>{m.offer.title}</h3>
            <p>{m.offer.sub}</p>
            <a className="fb-pill light sm">{m.cta}</a>
          </section>

          {m.rating && (
            <section className="fb-reviews">
              <div className="fb-g">G</div>
              <div><p className="fb-stars">★★★★★</p><b>{m.rating} on Google</b><p className="fb-muted">{m.reviews.toLocaleString()}+ reviews from {m.name} customers</p>
                {m.mapsUrl && <a href={m.mapsUrl} target="_blank" rel="noreferrer">See Google Reviews →</a>}</div>
            </section>
          )}

          <section className="fb-sec">
            <p className="fb-eyebrow dark">{m.highlightsLabel}</p>
            <h3 className="fb-h">{m.highlightsTitle[0]}<br />{m.highlightsTitle[1]}</h3>
            <div className="fb-grid">
              {m.highlights.map((h, i) => (
                <div key={h.title} className="fb-card">
                  <div className="fb-img" style={{ background: m.photos[i + 1] ? `url("${m.photos[i + 1]}") center/cover` : GRADIENT[m.industry] }} />
                  <p className="fb-eyebrow dark">{h.tag}</p><h4>{h.title}</h4><p className="fb-muted">{h.desc}</p>
                </div>
              ))}
            </div>
            <a className="fb-pill dark">{m.cta}</a>
          </section>

          <section className="fb-about">
            <p className="fb-eyebrow">{m.name}</p>
            <h3 className="fb-h">{m.aboutTitle}</h3>
            <p>{m.about}</p>
          </section>

          <section className="fb-sec">
            <p className="fb-eyebrow dark">Find us</p>
            <h3 className="fb-h">Come visit {m.name}.</h3>
            <div className="fb-loc">
              <span className="fb-num">01</span>
              <h4>{m.city}</h4>
              {m.address && <p>{m.address}</p>}
              {m.phone && <p><b>{m.phone}</b></p>}
              {m.hours?.length ? <div className="fb-hours">{m.hours.map(h => { const [d, ...t] = h.split(": "); return <p key={h}><span>{d}</span><span>{t.join(": ")}</span></p>; })}</div>
                : <p className="fb-muted">Hours from your Google profile appear here.</p>}
              {m.mapsUrl && <a href={m.mapsUrl} target="_blank" rel="noreferrer">Get directions →</a>}
            </div>
          </section>

          <section className="fb-sec">
            <p className="fb-eyebrow dark">Questions</p>
            {m.faq.map(([q, a]) => <details key={q} className="fb-faq"><summary>{q}</summary><p>{a}</p></details>)}
          </section>

          <footer className="fb-foot"><b className="fb-logo light"><span>{word.slice(0, split)}</span><i>{word.slice(split)}</i></b><p>© {new Date().getFullYear()} {m.name} · {m.tagline}</p></footer>
        </div>
      </div>

      <div className="wrap pvfix">
        <h2 className="h2">What's already fixed on this site</h2>
        <div className="grid3">
          {[["Title & description", `“${m.meta.title}”`], ["Business schema", `${m.schemaType} markup with address, hours and phone`], ["Clear call to action", `“${m.cta}” on every screen`],
            ["Mobile first", "Fast, responsive, tap-to-call"], ["Local keywords", `Built around “${m.tagline}”`], ["FAQ section", "Answers Google and AI assistants can quote"]]
            .map(([a, b]) => <div key={a} className="card feat"><h3>✓ {a}</h3><p className="muted">{b}</p></div>)}
        </div>
        <div className="center" style={{ marginTop: 28 }}><a href="/start?plan=site" className="btn dark lg">Launch my site for $299, 3 months free</a></div>
      </div>
    </main>
  );
}
