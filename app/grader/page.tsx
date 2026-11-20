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
interface Hit { id: string; name: string; address: string; category: string | null; website: string | null; rating: number | null; reviews: number }

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
  const [form, setForm] = useState({ url: "", businessName: "", city: "", keyword: "", address: "", phone: "", hasGoogle: "" });
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchErr, setSearchErr] = useState(false);
  const [active, setActive] = useState(-1);
  const [link, setLink] = useState("");
  const [linkErr, setLinkErr] = useState<string | null>(null);
  const [dq, setDq] = useState("");
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
    if (q.trim().length < 3) { setHits([]); setDq(""); return; }
    if (mapsOff) { timer.current = setTimeout(() => setDq(q.trim()), 600); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const loc = near ? `&lat=${near.lat}&lng=${near.lng}` : "";
        const j = await (await fetch(`/api/places?q=${encodeURIComponent(q)}${loc}`)).json();
        if (j.connected === false) setMapsOff(true);
        setSearchErr(!!j.error); setHits(j.results ?? []); setActive(-1);
      } catch { setSearchErr(true); setHits([]); }
      finally { setSearching(false); }
    }, 300);
  }, [q, near, mapsOff]);

  async function useLink(e: React.FormEvent) {
    e.preventDefault(); setLinkErr(null); setLoading("link");
    try {
      const j = await (await fetch(`/api/maplink?u=${encodeURIComponent(link)}`)).json();
      if (j.error) throw new Error(j.error);
      setLoading(null);
      await grade({ businessName: j.name, mapsUrl: j.mapsUrl, hasGoogle: "yes", keyword: "" }, "link");
    } catch (x) { setLinkErr((x as Error).message); setLoading(null); }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => { setNear({ lat: +p.coords.latitude.toFixed(3), lng: +p.coords.longitude.toFixed(3) }); setLocating(false); },
      () => setLocating(false), { timeout: 8000, maximumAge: 600000 });
  }
  const goManual = () => { setStep("manual"); setForm(f => ({ ...f, businessName: f.businessName || q })); scrollTo(0, 0); };
  function onKey(e: React.KeyboardEvent) {
    if (!hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, hits.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && active >= 0) { e.preventDefault(); grade({ placeId: hits[active].id }, hits[active].id); }
  }

  async function grade(payload: object, label: string) {
    setLoading(label); setErr(null);
    try {
      const res = await fetch("/api/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, src: new URLSearchParams(location.search).get("src") ?? "web" }) });
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
          <p className="muted">Search for your business the way customers do. We'll score your Google listing, website and local ranking, and show the exact fixes.</p>
          <div className="search">
            <input autoFocus type="search" enterKeyHint="search" autoComplete="off" aria-label="Search your business name"
              role="combobox" aria-expanded={hits.length > 0} aria-controls="hits" aria-activedescendant={active >= 0 ? `hit-${active}` : undefined}
              placeholder="Search your business name" value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} />
            {searching && <span className="spin" />}
          </div>
          {hits.length > 0 && (
            <ul className="hits" id="hits" role="listbox">
              {hits.map((h, i) => (
                <li key={h.id} id={`hit-${i}`} role="option" aria-selected={i === active}>
                  <button className={i === active ? "on" : ""} disabled={!!loading} onClick={() => grade({ placeId: h.id }, h.id)} onMouseEnter={() => setActive(i)}>
                    <span className="pin" aria-hidden="true">⌖</span>
                    <span className="t">{h.name}<small>{[h.category, h.address].filter(Boolean).join(" · ")}</small></span>
                    <span className="meta">{loading === h.id ? "Scanning…" : h.rating ? `★ ${h.rating} (${h.reviews})` : "No reviews"}</span>
                  </button>
                </li>
              ))}
              <li className="hit-add"><button onClick={goManual}><span className="pin" aria-hidden="true">+</span><span className="t">Not in the list?<small>Add your business by hand. If you're not on Google yet, we'll set that up too.</small></span></button></li>
            </ul>
          )}
          {!mapsOff && q.trim().length >= 3 && !searching && hits.length === 0 && (
            <div className="nohits">
              <p><b>{searchErr ? "Google search didn't respond." : `No Google listing found for "${q.trim()}".`}</b> {searchErr ? "You can still get your score by entering your details." : "That's often the first thing holding a business back, and we can fix it."}</p>
              <button className="btn dark" onClick={goManual}>Add my business</button>
            </div>
          )}
          {err && <p className="err">{err}</p>}
          {q.trim().length < 3 && <button className="link" onClick={goManual}>Can't find your business? Enter it manually</button>}
        </section>
      )}

      {step === "manual" && (
        <section className="hero">
          <button className="link back" onClick={() => setStep("find")}>← Back to Google Maps search</button>
          <h1>Tell us about your business</h1>
          <p className="muted">{mapsOff ? "Google Maps search isn't connected yet, so enter your details and we'll grade what we can." : "Not showing up on Google? That's the first thing we fix. Enter your details and we'll grade the rest."}</p>
          <form onSubmit={e => { e.preventDefault(); grade(form, "manual"); }} className="form">
            <label>Business name<input required autoComplete="organization" placeholder="Your business name" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} /></label>
            <label>What you sell<input required placeholder="e.g. tacos, haircuts, jewelry repair" value={form.keyword} onChange={e => setForm({ ...form, keyword: e.target.value })} /></label>
            <label>Street address <span className="muted">(optional)</span><input autoComplete="street-address" placeholder="123 Main St" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
            <div className="row">
              <label>City or area<input required autoComplete="address-level2" placeholder="Downtown LA" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></label>
              <label>Business phone <span className="muted">(optional)</span><input type="tel" autoComplete="tel" placeholder="(213) 555-0100" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
            </div>
            <label>Website <span className="muted">(optional)</span><input inputMode="url" autoComplete="url" placeholder="yourbusiness.com" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} onBlur={e => { const v = e.target.value.trim(); if (v && !/^https?:\/\//.test(v)) setForm(f => ({ ...f, url: "https://" + v })); }} /></label>
            <div className="gq-q" role="radiogroup" aria-label="Are you on Google Maps?">
              <span>Do you have a Google Business Profile?</span>
              {([["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] as const).map(([v, l]) => (
                <label key={v} className={form.hasGoogle === v ? "on" : ""}><input type="radio" name="hasGoogle" value={v} checked={form.hasGoogle === v} onChange={() => setForm({ ...form, hasGoogle: v })} />{l}</label>
              ))}
            </div>
            {form.hasGoogle && form.hasGoogle !== "yes" && <p className="small muted">No problem. Creating and verifying your Google profile is included in Google Management ($25/mo). Your report will show what you're missing.</p>}
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
  // null = still checking. Anonymous visitors see the score and top issues; the full report unlocks with a free account.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => { fetch("/api/me").then(x => x.json()).then(j => setLoggedIn(!!j.loggedIn)).catch(() => setLoggedIn(false)); }, []);
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

      {(r as any).manual && (r as any).manual.hasGoogle !== "yes" && !r.placeId && (
        <div className="nogbp"><b>You're not showing up on Google Maps yet.</b> When people nearby search for what you sell, you're not in the results. We'll create and verify your Google Business Profile as part of Google Management. <a href="#plan">Get set up</a></div>
      )}
      <p className="upsell">Want us to fix these for you? Google management starts at $25/mo. <a href="#plan">See plans</a></p>

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

      <div className="card aisite"><div><b>See your AI-built website</b><p className="muted small">We built a new site for {r.businessName} that fixes every SEO issue above.</p></div>
        <button className="btn lime sm" onClick={() => { try { sessionStorage.setItem("lokly_report", JSON.stringify(r)); } catch {} location.href = "/preview"; }}>Show me</button></div>

      {loggedIn === false && <Gate r={r} failed={failed} />}

      {loggedIn && <SaveReport r={r} pct={pct} />}

      {loggedIn && SECTIONS.map(s => <SectionView key={s.key} id={s.key} label={s.label} checks={r.checks.filter(c => c.section === s.key)}
        note={s.key === "local" && !r.placesConnected ? "Google Maps isn't connected yet, so listing and ranking checks were skipped."
          : s.key === "local" && r.placesError ? `Google Maps error: ${r.placesError}` : undefined} />)}

      <div id="plan" className="planwrap"><h2 className="sh-h2">Let Lokly handle it</h2>
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
    <a href="#plan" className="card nudge"><b>Fix all {issues} issues, websites from $299 with 3 months free</b><span>See plans →</span></a>
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

function SaveReport({ r, pct }: { r: Report; pct: number }) {
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setState("busy"); setErr(null);
    const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, businessName: r.businessName, website: r.url, placeId: r.placeId, city: r.city, score: pct, src: new URLSearchParams(location.search).get("src") ?? "web" }) });
    if (res.ok) setState("done"); else { setErr((await res.json()).error ?? "Couldn't save. Try again."); setState("idle"); }
  }
  if (state === "done") return <div className="card saved"><b>Report saved.</b><p className="muted small">We'll send a copy to {f.email} and follow up with what to fix first.</p></div>;
  return (
    <form className="card savef" onSubmit={save}>
      <div><b>Save this report</b><p className="muted small">We'll email you a copy and the three fixes that matter most.</p></div>
      <div className="savegrid">
        <input required aria-label="Your name" autoComplete="name" placeholder="Your name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input required type="email" aria-label="Email" autoComplete="email" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <input type="tel" aria-label="Mobile number" autoComplete="tel" placeholder="Mobile (optional)" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
        <button className="btn dark" disabled={state === "busy"}>{state === "busy" ? "Saving…" : "Save report"}</button>
      </div>
      {err && <p className="err">{err}</p>}
      <p className="tiny muted">By saving, you agree we can contact you about your report. See our <a href="/privacy">Privacy Policy</a>.</p>
    </form>
  );
}

function Gate({ r, failed }: { r: Report; failed: Check[] }) {
  const top = [...failed].sort((a: any, b: any) => (b.weight ?? 0) - (a.weight ?? 0)).slice(0, 3);
  const rest = failed.length - top.length;
  const unlock = () => {
    try { sessionStorage.setItem("kern_report", JSON.stringify(r)); } catch {}
    location.href = "/signup?from=grader";
  };
  return (
    <div className="card gate">
      <p className="eyebrow">Your biggest issues</p>
      {top.length === 0 ? <p className="muted">No major issues found. Create a free account to see the full checklist and track your score.</p>
        : top.map(c => <div key={c.id} className="item fail"><button tabIndex={-1} aria-disabled="true"><i>✕</i><span className="t">{c.title}<small>{c.why}</small></span></button></div>)}
      {rest > 0 && <div className="gate-locked" aria-hidden="true">{failed.slice(3, 6).map(c => <div key={c.id} className="gate-blur">{c.title}</div>)}</div>}
      <div className="gate-cta">
        <b>{rest > 0 ? `See all ${failed.length} issues and how to fix each one` : "Save your report and track your score"}</b>
        <p className="muted small">Free account. Your report saves to your dashboard so you can rescan and watch your score go up.</p>
        <button className="btn dark" onClick={unlock}>Create my free account</button>
        <p className="small muted">Already have one? <a href="/login" onClick={e => { e.preventDefault(); try { sessionStorage.setItem("kern_report", JSON.stringify(r)); } catch {} location.href = "/login"; }}>Log in to save it</a></p>
      </div>
    </div>
  );
}
