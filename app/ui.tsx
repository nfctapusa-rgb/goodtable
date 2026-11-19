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
        <a href="/" className="logo"><svg className="mark" viewBox="0 0 40 50" aria-hidden="true"><ellipse cx="20" cy="47" rx="13" ry="2.6" fill="#D5DBE3"/><path d="M20 2C10 2 3 9.3 3 18.6c0 9 7.3 15.6 17 26.4 9.7-10.8 17-17.4 17-26.4C37 9.3 30 2 20 2z" fill="#F2462E"/></svg>Lokly</a>
        <div className={`links ${open ? "open" : ""}`}>
          <a href="/how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <a href="/mailers">Mailers</a>
          <a href="/login">Log in</a>
          <a href="/grader" className="btn dark sm">Get my free report</a>
        </div>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button>
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
        <div><a href="/" className="logo"><svg className="mark" viewBox="0 0 40 50" aria-hidden="true"><ellipse cx="20" cy="47" rx="13" ry="2.6" fill="#D5DBE3"/><path d="M20 2C10 2 3 9.3 3 18.6c0 9 7.3 15.6 17 26.4 9.7-10.8 17-17.4 17-26.4C37 9.3 30 2 20 2z" fill="#F2462E"/></svg>Lokly</a><p className="muted small">Websites and Google profiles for local businesses. Downtown LA.</p></div>
        <div className="fcols">
          <div><b>Product</b><a href="/how-it-works">How it works</a><a href="/pricing">Pricing</a><a href="/grader">Free report</a></div>
          <div><b>Company</b><a href="mailto:hello@lokly.pro">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
        </div>
      </div>
      <div className="wrap muted small copy">© {new Date().getFullYear()} Lokly. Lokly is an independent company and is not affiliated with, endorsed by, or sponsored by Google, DoorDash or Uber Eats. Rankings are determined by Google and are not guaranteed.</div>
    </footer>
  );
}
