import { redirect } from "next/navigation";
import { googleStats } from "@/lib/leadsnap";
import { db, dbReady } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { RescanButton, BizSwitcher } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard | Lokly" };

const TOOLS = [
  { k: "website", t: "Website", d: "AI-built site that fixes your SEO issues", plan: "growth" },
  { k: "catalog", t: "Products & services", d: "Everything you sell, with prices and photos", plan: "growth" },
  { k: "orders", t: "Orders & bookings", d: "Take orders and appointments directly", plan: "growth" },
  { k: "customers", t: "Customers", d: "CRM with every customer and purchase", plan: "growth" },
  { k: "marketing", t: "Email & SMS", d: "Campaigns and automations", plan: "growth" },
  { k: "loyalty", t: "Loyalty", d: "Points and rewards", plan: "growth" },
  { k: "reviews", t: "Reviews", d: "Review requests and replies", plan: "growth" },
  { k: "ai", t: "Lokly AI", d: "Ask questions, make changes in plain English", plan: "growth" },
];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  if (!dbReady()) return <main className="narrow"><section className="hero"><h1>Dashboard</h1><p className="note">The database isn't connected yet. Add a Postgres database to this Vercel project to turn on accounts.</p></section></main>;
  const user = await currentUser();
  if (!user) redirect("/login");
  const sql = await db();
  const bizList = await sql`SELECT b.id, b.name, b.plan, b.website, b.address, b.stats_url, b.leadsnap_id FROM businesses b
    JOIN memberships m ON m.business_id = b.id WHERE m.user_id = ${user.id} ORDER BY b.created_at`;
  const { b } = await searchParams;
  const biz = bizList.find(x => x.id === b) ?? bizList[0];
  const gs = biz?.leadsnap_id ? await googleStats(biz.leadsnap_id) : null;

  if (!biz) return (
    <main className="narrow"><section className="hero"><h1>Welcome{user.name ? `, ${user.name}` : ""}</h1>
      <p className="muted">You don't have a business yet. Grade one to get started.</p><a href="/grader" className="btn dark">Grade my business</a></section></main>
  );

  const reports = await sql`SELECT id, score, data, created_at FROM reports WHERE business_id = ${biz.id} ORDER BY created_at DESC LIMIT 12`;
  const latest = reports[0];
  const prev = reports[1];
  const checks: any[] = latest?.data?.checks ?? [];
  const todo = checks.filter(c => c.status === "fail").sort((a, b) => b.weight - a.weight);
  const paid = biz.plan !== "free";
  const delta = latest && prev ? latest.score - prev.score : null;

  return (
    <div className="dash">
      <aside className="side">
        <BizSwitcher list={bizList.map(x => ({ id: x.id, name: x.name }))} current={biz.id} />
        <nav>
          <a className="on" href={`/dashboard?b=${biz.id}`}>Overview</a>
          {TOOLS.map(t => <span key={t.k} className="soon" title="In development">{t.t}<em>Soon</em></span>)}
        </nav>
        <form action="/api/auth/logout" method="post"><button className="link">Log out</button></form>
      </aside>

      <main className="dmain">
        <div className="dhead">
          <div><p className="eyebrow">{biz.address ?? biz.website ?? "Your business"}</p><h1>{biz.name}</h1></div>
          <span className={`badge ${paid ? "paid" : ""}`}>{paid ? (biz.plan === "pro" ? "Lokly Pro" : biz.plan === "local" ? "Lokly Local" : "Lokly") : "Free plan"}</span>
        </div>

        <div className="kpis">
          <div className="card kpi"><span>Visibility score</span><b>{latest ? latest.score : "—"}<small>/100</small></b>
            {delta !== null && <em className={delta >= 0 ? "good" : "bad"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} since last scan</em>}</div>
          <div className="card kpi"><span>Issues to fix</span><b>{latest ? todo.length : "—"}</b><em className="muted">from your latest scan</em></div>
          <div className="card kpi"><span>Last scanned</span><b className="sm">{latest ? new Date(latest.created_at).toLocaleDateString() : "Never"}</b><RescanButton businessId={biz.id} /></div>
        </div>

        {reports.length > 1 && (
          <div className="card">
            <p className="eyebrow">Score history</p>
            <div className="spark">{[...reports].reverse().map(r => <div key={r.id} title={`${r.score} · ${new Date(r.created_at).toLocaleDateString()}`} style={{ height: `${Math.max(r.score, 4)}%` }} />)}</div>
          </div>
        )}

        {gs ? (
          <div className="card gstats">
            <div className="gs-head"><b>Your Google stats</b><span className="muted small">Last 30 days vs the 30 before</span></div>
            <div className="gs-kpis">
              {([["Times you showed up", gs.appearances], ["Calls", gs.calls], ["Calls, clicks & directions", gs.actions]] as const).map(([label, k]) => (
                <div key={label}><strong>{k.current.toLocaleString()}</strong><span>{label}</span>
                  {k.change_pct != null && <em className={k.change_pct >= 0 ? "up" : "down"}>{k.change_pct >= 0 ? "+" : ""}{k.change_pct}%</em>}</div>
              ))}
              {gs.reviews && <div><strong>{gs.reviews.rating?.toFixed?.(1) ?? gs.reviews.rating}★</strong><span>{gs.reviews.count} reviews{gs.reviews.unreplied ? `, ${gs.reviews.unreplied} awaiting reply` : ", all replied"}</span></div>}
            </div>
            {gs.trend.length > 0 && (() => { const max = Math.max(...gs.trend.map(t => t.maps + t.search), 1); return (
              <div className="gs-chart" aria-label="Monthly appearances on Google Search and Maps">
                {gs.trend.map(t => <div key={t.period} title={`${t.period}: ${t.search} Search, ${t.maps} Maps`}>
                  <i style={{ height: `${(t.search / max) * 100}%` }} className="s" /><i style={{ height: `${(t.maps / max) * 100}%` }} className="m" />
                  <small>{new Date(t.period + "-02").toLocaleString("en-US", { month: "short" })}</small></div>)}
              </div>); })()}
            <p className="gs-legend small muted"><span className="s" /> Google Search <span className="m" /> Google Maps</p>
            {gs.tips.map(t => <p key={t.title} className="small"><b>{t.title}.</b> {t.body}</p>)}
            {biz.stats_url && <a className="btn dark sm" href={biz.stats_url} target="_blank" rel="noreferrer">Open full report</a>}
          </div>
        ) : (
        <div className="card stats">
          <div><b>Your Google stats</b><p className="muted small">Calls, direction requests, and how often you show up on Google, updated by your Lokly team.</p></div>
          {biz.stats_url ? <a className="btn dark sm" href={biz.stats_url} target="_blank" rel="noreferrer">Open my Google stats</a>
            : <p className="muted small">We're connecting your Google profile. Your stats will show up here within 1 business day of signup.</p>}
        </div>
        )}

        {!paid && (
          <a href="/pricing" className="card nudge"><b>Let Lokly fix {todo.length ? `all ${todo.length} issues` : "everything"} from $25/mo</b><span>See the plan →</span></a>
        )}

        <div className="card">
          <p className="eyebrow">Your to-do list</p>
          {!latest && <p className="muted">No scan yet. Run one to build your list.</p>}
          {latest && todo.length === 0 && <p>Nothing to fix. Nice work.</p>}
          <ol className="todo">
            {todo.slice(0, 15).map(c => (
              <li key={c.id}><span className={`sev ${c.weight >= 2 ? "hi" : ""}`}>{c.weight >= 2 ? "High" : "Med"}</span>
                <div><b>{c.title}</b><p className="muted">{c.why}</p>{c.found && <code>Found: {c.found}</code>}</div></li>
            ))}
          </ol>
        </div>

        <div className="card">
          <p className="eyebrow">Your tools</p>
          <div className="toolgrid">
            {TOOLS.map(t => <div key={t.k} className="tool"><b>{t.t}</b><p className="muted">{t.d}</p><span className="soon-tag">In development</span></div>)}
          </div>
        </div>
      </main>
    </div>
  );
}
