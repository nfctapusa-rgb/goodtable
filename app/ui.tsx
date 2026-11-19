"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function Nav() {
  const [open, setOpen] = useState(false);
  if (usePathname()?.startsWith("/dashboard")) return null;
  return (
    <nav className="nav" aria-label="Main">
      <a href="#main" className="skip">Skip to content</a>
      <div className="wrap navin">
        <a href="/" className="logo"><svg className="mark" viewBox="0 0 40 52" aria-hidden="true"><ellipse cx="20" cy="49.5" rx="11" ry="2.2" fill="#D5DBE3"/><path fill="#E30A23" fill-rule="evenodd" d="M20 2C10.6 2 3.6 9.1 3.6 18.2c0 3.2.9 5.4 2.3 8.3L20 46l14.1-19.5c1.4-2.9 2.3-5.1 2.3-8.3C36.4 9.1 29.4 2 20 2zm0 8.6a7.6 7.6 0 1 1 0 15.2 7.6 7.6 0 0 1 0-15.2z"/></svg>Lokly</a>
        <div className={`links ${open ? "open" : ""}`}>
          <a href="/how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <a href="/mailers">Mailers</a>
          <a href="/login">Log in</a>
          <a href="/grader" className="btn dark sm">Get my free report</a>
        </div>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg></button>
      </div>
    </nav>
  );
}

export function SearchHero({ cta = "Get my free report" }: { cta?: string }) {
  const [q, setQ] = useState("");
  return (
    <form className="herosearch" onSubmit={e => { e.preventDefault(); location.href = `/grader${q ? `?q=${encodeURIComponent(q)}` : ""}`; }}>
      <input aria-label="Business name" autoComplete="organization" placeholder="Find your business name" value={q} onChange={e => setQ(e.target.value)} />
      <button className="btn lime">{cta}</button>
    </form>
  );
}

export function Footer() {
  if (usePathname()?.startsWith("/dashboard")) return null;
  return (
    <footer className="foot">
      <div className="wrap footin">
        <div><a href="/" className="logo"><svg className="mark" viewBox="0 0 40 52" aria-hidden="true"><ellipse cx="20" cy="49.5" rx="11" ry="2.2" fill="#D5DBE3"/><path fill="#E30A23" fill-rule="evenodd" d="M20 2C10.6 2 3.6 9.1 3.6 18.2c0 3.2.9 5.4 2.3 8.3L20 46l14.1-19.5c1.4-2.9 2.3-5.1 2.3-8.3C36.4 9.1 29.4 2 20 2zm0 8.6a7.6 7.6 0 1 1 0 15.2 7.6 7.6 0 0 1 0-15.2z"/></svg>Lokly</a><p className="muted small">Websites and Google profiles for local businesses. Downtown LA.</p></div>
        <div className="fcols">
          <div><b>Product</b><a href="/how-it-works">How it works</a><a href="/pricing">Pricing</a><a href="/grader">Free report</a></div>
          <div><b>Company</b><a href="mailto:hello@lokly.pro">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
        </div>
      </div>
      <div className="wrap muted small copy">© {new Date().getFullYear()} Lokly. Lokly is an independent company and is not affiliated with, endorsed by, or sponsored by Google, DoorDash or Uber Eats. Rankings are determined by Google and are not guaranteed.</div>
    </footer>
  );
}
