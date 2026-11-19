import { redirect } from "next/navigation";
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
  const bizList = await sql`SELECT b.id, b.name, b.plan, b.website, b.address, b.stats_url FROM businesses b
    JOIN memberships m ON m.business_id = b.id WHERE m.user_id = ${user.id} ORDER BY b.created_at`;
  const { b } = await searchParams;
  const biz = bizList.find(x => x.id === b) ?? bizList[0];

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

        <div className="card stats">
          <div><b>Your Google stats</b><p className="muted small">Calls, direction requests, profile views and where you rank in your area, updated by your Lokly team.</p></div>
          {biz.stats_url ? <a className="btn dark sm" href={biz.stats_url} target="_blank" rel="noreferrer">Open my Google stats</a>
            : <p className="muted small">We're connecting your Google profile. Your stats will show up here within 1 business day of signup.</p>}
        </div>

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
