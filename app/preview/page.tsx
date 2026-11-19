"use client";
import { useEffect, useState } from "react";
import { generateSite, type SiteModel } from "@/lib/sitegen";

const THEMES: Record<string, { bg: string; ink: string; accent: string; soft: string }> = {
  food: { bg: "#1A1410", ink: "#FFF7EE", accent: "#F2683C", soft: "#2A211B" },
  beauty: { bg: "#F7F1EE", ink: "#2B1F1D", accent: "#B5776B", soft: "#EFE4DF" },
  auto: { bg: "#0F1418", ink: "#EEF3F6", accent: "#2F80ED", soft: "#1B242B" },
  health: { bg: "#F3F8F7", ink: "#12302B", accent: "#1F9C86", soft: "#E3EFEC" },
  fitness: { bg: "#0E0E10", ink: "#F5F5F5", accent: "#C7F36B", soft: "#1C1C20" },
  home: { bg: "#F6F7F9", ink: "#14213D", accent: "#F59E0B", soft: "#E8ECF2" },
  pro: { bg: "#F7F7F5", ink: "#101318", accent: "#3D5AFE", soft: "#ECECE8" },
  retail: { bg: "#FBF8F3", ink: "#1E1B16", accent: "#B08D57", soft: "#F1EBE1" },
  other: { bg: "#F7F8F5", ink: "#101318", accent: "#101318", soft: "#ECEEE9" },
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
  const t = THEMES[m.industry];

  return (
    <main className="pv">
      <div className="pvbar wrap">
        <div><p className="eyebrow">Your AI website · preview</p><h1 className="pvh">{m.name}</h1>
          <p className="muted small">Built from your Google profile, with every SEO issue from your report fixed.</p></div>
        <div className="pvctl">
          <div className="seg"><button className={view === "mobile" ? "on" : ""} onClick={() => setView("mobile")}>Mobile</button>
            <button className={view === "desktop" ? "on" : ""} onClick={() => setView("desktop")}>Desktop</button></div>
          <a href="/pricing" className="btn lime">Launch this site · $49.99/mo</a>
        </div>
      </div>

      <div className={`frame ${view}`}>
        <div className="site" style={{ background: t.bg, color: t.ink, ["--a" as any]: t.accent, ["--s" as any]: t.soft }}>
          <header className="s-nav"><b>{m.name}</b><a className="s-btn">{m.cta}</a></header>
          <section className="s-hero">
            <p className="s-tag">{m.tagline}</p>
            <h2>{m.headline}</h2>
            <p className="s-sub">{m.sub}</p>
            <div className="s-ctas"><a className="s-btn lg">{m.cta}</a><a className="s-ghost">{m.ctaSecondary}</a></div>
            {m.rating && <p className="s-rate">★★★★★ <span>{m.rating} on Google · {m.reviews} reviews</span></p>}
          </section>
          <section className="s-grid">
            {m.services.map(s => <div key={s.title} className="s-card"><h3>{s.title}</h3><p>{s.desc}</p></div>)}
          </section>
          <section className="s-about"><h3>About {m.name}</h3><p>{m.about}</p></section>
          <section className="s-info">
            {m.address && <div><h4>Visit</h4><p>{m.address}</p>{m.mapsUrl && <a href={m.mapsUrl} target="_blank" rel="noreferrer">Get directions</a>}</div>}
            {m.hours && <div><h4>Hours</h4>{m.hours.map(h => <p key={h}>{h}</p>)}</div>}
            {m.phone && <div><h4>Call</h4><p>{m.phone}</p></div>}
          </section>
          <section className="s-faq"><h3>Questions</h3>{m.faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
          <footer className="s-foot">© {new Date().getFullYear()} {m.name} · {m.city}</footer>
        </div>
      </div>

      <div className="wrap pvfix">
        <h2 className="h2">What's already fixed on this site</h2>
        <div className="grid3">
          {[["Title & description", `“${m.meta.title}”`], ["Business schema", `${m.schemaType} markup with address, hours and phone`], ["Clear call to action", `“${m.cta}” on every screen`],
            ["Mobile first", "Fast, responsive, tap-to-call"], ["Local keywords", `Built around “${m.tagline}”`], ["FAQ section", "Answers Google and AI assistants can quote"]]
            .map(([a, b]) => <div key={a} className="card feat"><h3>✓ {a}</h3><p className="muted">{b}</p></div>)}
        </div>
        <div className="center" style={{ marginTop: 28 }}><a href="/pricing" className="btn dark lg">Launch my site for $49.99/mo</a></div>
      </div>
    </main>
  );
}
