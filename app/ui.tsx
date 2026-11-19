"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function Nav() {
  const [open, setOpen] = useState(false);
  if (usePathname()?.startsWith("/dashboard")) return null;
  return (
    <nav className="nav">
      <div className="wrap navin">
        <a href="/" className="logo"><span className="mark" />GoodTable</a>
        <div className={`links ${open ? "open" : ""}`}>
          <a href="/how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <a href="/login">Log in</a>
          <a href="/grader" className="btn dark sm">Get my free report</a>
        </div>
        <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
      </div>
    </nav>
  );
}

export function SearchHero({ cta = "Get my free report" }: { cta?: string }) {
  const [q, setQ] = useState("");
  return (
    <form className="herosearch" onSubmit={e => { e.preventDefault(); location.href = `/grader${q ? `?q=${encodeURIComponent(q)}` : ""}`; }}>
      <input placeholder="Find your business name" value={q} onChange={e => setQ(e.target.value)} />
      <button className="btn lime">{cta} ↗</button>
    </form>
  );
}

export function Footer() {
  if (usePathname()?.startsWith("/dashboard")) return null;
  return (
    <footer className="foot">
      <div className="wrap footin">
        <div><a href="/" className="logo"><span className="mark" />GoodTable</a><p className="muted small">Everything your business needs to grow online.</p></div>
        <div className="fcols">
          <div><b>Product</b><a href="/how-it-works">How it works</a><a href="/pricing">Pricing</a><a href="/grader">Free report</a></div>
          <div><b>Company</b><a href="mailto:hello@goodtable.us">Contact</a></div>
        </div>
      </div>
      <div className="wrap muted small copy">© {new Date().getFullYear()} GoodTable</div>
    </footer>
  );
}
