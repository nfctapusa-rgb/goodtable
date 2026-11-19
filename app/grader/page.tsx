"use client";
import { useEffect, useRef, useState } from "react";
import { PlanCards } from "../plancards";

type Status = "pass" | "fail" | "unknown";
interface Check { id: string; section: "search" | "experience" | "local"; group: string; title: string; why: string; status: Status; found?: string; expected?: string }
interface Report {
  url: string | null; businessName: string; city?: string; keyword?: string; placeId: string | null; address: string | null; gradedAt: string; profile?: any;
  scores: Record<"search" | "experience" | "local", { got: number; max: number }>;
  placesConnected: boolean; placesError?: string;
  rankings: { query: string; position: number | null; top: string[] }[];
  checks: Check[];
}
interface Hit { id: string; name: string; address: string; website: string | null; rating: number | null; reviews: number }

const SECTIONS = [
  { key: "search", label: "Search listings" },
  { key: "experience", label: "Guest experience" },
  { key: "local", label: "Local listings" },
] as const;
const TOOLS = [
  ["AI website", "Built for you, fixes every issue in this report"],
  ["Direct ordering & booking", "Take orders, bookings and payments with no third-party commission"],
  ["Google profile management", "Posts, photos, hours and review replies kept up to date"],
  ["Local SEO engine", "Schema, sitemaps, location pages and keyword tracking"],
  ["Customer CRM", "Every customer, order and booking in one place"],
  ["Email & SMS marketing", "Campaigns plus win-back, review-request and reminder automations"],
  ["Loyalty program", "Points and rewards that bring customers back"],
  ["Lokly AI assistant", "Ask questions about your business and make changes in plain English"],
];

const tone = (got: number, max: number) => !max ? "muted" : got / max >= 0.8 ? "good" : got / max >= 0.5 ? "warn" : "bad";

export default function Page() {
  const [step, setStep] = useState<"find" | "manual" | "report" | "welcome">("find");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [mapsOff, setMapsOff] = useState(false);
  const [form, setForm] = useState({ url: "", businessName: "", city: "", keyword: "" });
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [r, setR] = useState<Report | null>(null);
  const timer = useRef<any>(null);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get("welcome")) setStep("welcome");
    if (p.get("q")) setQ(p.get("q")!);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 3) { setHits([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const j = await (await fetch(`/api/places?q=${encodeURIComponent(q)}`)).json();
        if (j.connected === false) { setMapsOff(true); setStep("manual"); setForm(f => ({ ...f, businessName: q })); }
        setHits(j.results ?? []);
      } finally { setSearching(false); }
    }, 350);
  }, [q]);

  async function grade(payload: object, label: string) {
    setLoading(label); setErr(null);
    try {
      const res = await fetch("/api/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setR(j); setStep("report"); scrollTo(0, 0);
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(null); }
  }

  return (
    <main className="narrow">

      {step === "find" && (
        <section className="hero">
          <h1>How visible is your business online?</h1>
          <p className="muted">Find your business on Google Maps for a free score covering your Google listing, website and local ranking, plus the exact fixes.</p>
          <div className="search">
            <input autoFocus aria-label="Search your business name and city" placeholder="Search your business name and city…" value={q} onChange={e => setQ(e.target.value)} />
            {searching && <span className="spin" />}
          </div>
          {hits.length > 0 && (
            <ul className="hits">
              {hits.map(h => (
                <li key={h.id}>
                  <button disabled={!!loading} onClick={() => grade({ placeId: h.id }, h.id)}>
                    <span className="pin">⌖</span>
                    <span className="t">{h.name}<small>{h.address}</small></span>
                    <span className="meta">{loading === h.id ? "Scanning…" : h.rating ? `★ ${h.rating} (${h.reviews})` : "No reviews"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {q.trim().length >= 3 && !searching && hits.length === 0 && <p className="muted small">No matches on Google Maps yet.</p>}
          {err && <p className="err">{err}</p>}
          <button className="link" onClick={() => { setStep("manual"); setForm(f => ({ ...f, businessName: q })); }}>Can't find your business? Enter it manually →</button>
        </section>
      )}

      {step === "manual" && (
        <section className="hero">
          <button className="link back" onClick={() => setStep("find")}>← Back to Google Maps search</button>
          <h1>Tell us about your business</h1>
          <p className="muted">{mapsOff ? "Google Maps search isn't connected yet, so enter your details and we'll grade what we can." : "Not on Google Maps? That's the first thing we'll fix. Enter your details and we'll grade the rest."}</p>
          <form onSubmit={e => { e.preventDefault(); grade(form, "manual"); }} className="form">
            <label>Business name<input required placeholder="Flamebachi" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} /></label>
            <label>Website <span className="muted">(optional)</span><input placeholder="yourbusiness.com" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></label>
            <div className="row">
              <label>City or area<input required placeholder="Downtown LA" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></label>
              <label>What you sell<input required placeholder="hibachi" value={form.keyword} onChange={e => setForm({ ...form, keyword: e.target.value })} /></label>
            </div>
            <button className="btn dark" disabled={!!loading}>{loading ? "Scanning…" : "Get my free score"}</button>
            {err && <p className="err">{err}</p>}
          </form>
        </section>
      )}

      {step === "report" && r && <ReportView r={r} onReset={() => { setR(null); setQ(""); setHits([]); setStep("find"); }} />}

      {step === "welcome" && (
        <section className="hero">
          <h1>Welcome to Lokly 🎉</h1>
          <p className="muted">Your subscription is active. We'll email you within one business day to start building your site and fixing your Google profile.</p>
          <a className="btn dark" href="/">Grade another business</a>
        </section>
      )}
    </main>
  );
}

function ReportView({ r, onReset }: { r: Report; onReset: () => void }) {
  const failed = r.checks.filter(c => c.status === "fail");
  const total = SECTIONS.reduce((a, s) => a + r.scores[s.key].got, 0);
  const max = SECTIONS.reduce((a, s) => a + r.scores[s.key].max, 0);
  const pct = max ? Math.round((total / max) * 100) : 0;
  const host = r.url ? new URL(r.url).hostname : "No website";

  return (
    <section className="report">
      <div className="summary card">
        <div>
          <p className="eyebrow">{host}</p>
          <h2>{r.businessName}</h2>
          <p className="muted">{r.address ? r.address + " · " : ""}{failed.length} issues found</p>
        </div>
        <div className={`dial ${tone(total, max)}`}><b>{pct}</b><span>/100</span></div>
      </div>

      <div className="scores">
        {SECTIONS.map(s => {
          const sc = r.scores[s.key];
          return <a key={s.key} href={`#${s.key}`} className="score"><b className={tone(sc.got, sc.max)}>{sc.max ? `${sc.got}/${sc.max}` : "—"}</b><span>{s.label}</span></a>;
        })}
      </div>

      {r.rankings.length > 0 && (
        <div className="card">
          <p className="eyebrow">Local rankings</p>
          {r.rankings.map(rk => {
            const ahead = rk.position ? rk.position - 1 : rk.top.length;
            return (
              <div key={rk.query} className="rank">
                <h3>{rk.position === 1 ? "You're #1 on Google for" : `${ahead} businesses are beating you on Google for`}</h3>
                <p className="q">“{rk.query}”</p>
                <ol>{rk.top.map((n, i) => <li key={i} className={i + 1 === rk.position ? "me" : ""}><span>{i + 1}</span>{n}</li>)}</ol>
                {!rk.position && <p className="muted small">{r.businessName} isn't in the top {rk.top.length}.</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="card aisite"><div><p className="eyebrow lime-t">New</p><b>See your AI website</b><p className="muted small">We built a new site for {r.businessName} that fixes every SEO issue above.</p></div>
        <button className="btn lime sm" onClick={() => { try { sessionStorage.setItem("lokly_report", JSON.stringify(r)); } catch {} location.href = "/preview"; }}>Show me ↗</button></div>

      <div className="card save"><div><b>Track your score over time</b><p className="muted small">Create a free account to save this report and get your to-do list.</p></div>
        <button className="btn dark sm" onClick={() => { try { sessionStorage.setItem("kern_report", JSON.stringify(r)); } catch {} location.href = "/signup"; }}>Save report</button></div>

      <Plan r={r} pct={pct} issues={failed.length} compact />

      {SECTIONS.map(s => <SectionView key={s.key} id={s.key} label={s.label} checks={r.checks.filter(c => c.section === s.key)}
        note={s.key === "local" && !r.placesConnected ? "Google Maps isn't connected yet, so listing and ranking checks were skipped."
          : s.key === "local" && r.placesError ? `Google Maps error: ${r.placesError}` : undefined} />)}

      <div id="plan" className="planwrap"><h2 className="h2">Fix all {failed.length} issues with Lokly</h2>
        <PlanCards compact context={{ businessName: r.businessName, website: r.url, placeId: r.placeId }} /></div>
      <button className="btn ghost" onClick={onReset}>Grade another business</button>
    </section>
  );
}

function Plan({ r, pct, issues, compact }: { r: Report; pct: number; issues: number; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, businessName: r.businessName, website: r.url, placeId: r.placeId, score: pct }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      location.href = j.url;
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  if (compact) return (
    <a href="#plan" className="card nudge"><b>Fix all {issues} issues, websites from $150</b><span>See plans →</span></a>
  );
  return (
    <div id="plan" className="card plan">
      <p className="eyebrow lime-t">Lokly Growth</p>
      <h3>Fix all {issues} issues and grow, for one monthly price.</h3>
      <div className="price"><b>$25</b><span>/month · cancel anytime</span></div>
      <ul className="tools">{TOOLS.map(([t, d]) => <li key={t}><i>✓</i><span>{t}<small>{d}</small></span></li>)}</ul>
      <form onSubmit={go} className="form">
        <input type="email" required placeholder="you@business.com" value={email} onChange={e => setEmail(e.target.value)} />
        <button className="btn lime wide" disabled={busy}>{busy ? "Opening checkout…" : "Start for $25/mo"}</button>
        {err && <p className="err">{err}</p>}
      </form>
    </div>
  );
}

function SectionView({ id, label, checks, note }: { id: string; label: string; checks: Check[]; note?: string }) {
  const groups = [...new Set(checks.map(c => c.group))];
  const order: Record<Status, number> = { fail: 0, unknown: 1, pass: 2 };
  return (
    <div id={id} className="card">
      <p className="eyebrow">{label}</p>
      {note && <p className="note">{note}</p>}
      {groups.map(g => (
        <div key={g} className="group">
          <h4>{g}</h4>
          {checks.filter(c => c.group === g).sort((a, b) => order[a.status] - order[b.status]).map(c => <Item key={c.id} c={c} />)}
        </div>
      ))}
    </div>
  );
}

function Item({ c }: { c: Check }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`item ${c.status}`}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>
        <i>{c.status === "pass" ? "✓" : c.status === "fail" ? "✕" : "?"}</i>
        <span className="t">{c.title}<small>{c.status === "unknown" ? "Unable to determine" : c.why}</small></span>
        <span className="chev">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="detail">
          <p>{c.why}</p>
          {c.found !== undefined && <><h5>What we found</h5><code>{c.found || "—"}</code></>}
          {c.expected && <><h5>We were looking for</h5><code>{c.expected}</code></>}
        </div>
      )}
    </div>
  );
}
