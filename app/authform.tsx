"use client";
import { useEffect, useState } from "react";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const [f, setF] = useState({ name: "", email: "", password: "", businessName: "" });
  const [report, setReport] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { try { const r = sessionStorage.getItem("kern_report"); if (r) setReport(JSON.parse(r)); } catch {} }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, report }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      try { sessionStorage.removeItem("kern_report"); } catch {}
      location.href = "/dashboard";
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  const signup = mode === "signup";
  return (
    <main className="narrow">
      <section className="hero authbox">
        <h1>{signup ? "Create your free Lokly account" : "Log in to Lokly"}</h1>
        {report ? <p className="note">We'll save the report for <b>{report.businessName}</b> to your dashboard.</p>
          : signup && <p className="muted">Track your score, see what to fix, and manage your business in one place.</p>}
        <form onSubmit={submit} className="form">
          {signup && <label>Your name<input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} autoComplete="name" /></label>}
          {signup && !report && <label>Business name<input required value={f.businessName} onChange={e => setF({ ...f, businessName: e.target.value })} /></label>}
          <label>Email<input required type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} autoComplete="email" /></label>
          <label>Password<input required type="password" minLength={8} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} autoComplete={signup ? "new-password" : "current-password"} /></label>
          <button className="btn dark" disabled={busy}>{busy ? "One moment…" : signup ? "Create account" : "Log in"}</button>
          {err && <p className="err">{err}</p>}
        </form>
        <p className="muted small">{signup ? <>Already have an account? <a href="/login">Log in</a></> : <>New to Lokly? <a href="/signup">Create an account</a></>}</p>
      </section>
    </main>
  );
}
