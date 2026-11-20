import { db, dbReady } from "@/lib/db";
import { AdminNav } from "./nav";
import { Today } from "./today";
import { shareUrl } from "@/lib/share";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Lokly", robots: { index: false, follow: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ key?: string; msg?: string }> }) {
  const { key, msg } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return (
    <main className="narrow"><section className="hero">
      <h1 className="sh-h2">Lokly admin</h1>
      <form method="get" action="/admin" className="form" style={{ maxWidth: 360 }}>
        <label>Admin key<input name="key" type="password" autoComplete="current-password" required /></label>
        <button className="btn dark">Open admin</button>
        {key && <p className="err">That key didn't match.</p>}
      </form>
    </section></main>
  );
  if (!dbReady()) return <main className="narrow"><section className="hero"><p>Database not connected.</p></section></main>;
  const sql = await db();
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 300` as any[];
  const clients = await sql`SELECT b.id, b.name, b.plan, b.stats_url, b.leadsnap_id, b.status, b.trial_ends_at, b.setup, b.phone, b.addons, b.created_at, u.email FROM businesses b
    LEFT JOIN memberships m ON m.business_id = b.id AND m.role = 'owner' LEFT JOIN users u ON u.id = m.user_id ORDER BY b.created_at DESC LIMIT 200` as any[];
  const allTasks = await sql`SELECT business_id, key, title, who, done FROM tasks ORDER BY sort` as any[];
  const tasksOf = (id: string) => allTasks.filter(t => t.business_id === id);
  const signups = rows.filter(r => r.kind === "onboarding");
  const reports = rows.filter(r => r.kind === "report");
  const toolReqs = rows.filter(r => r.kind === "tool");
  const mailers = rows.filter(r => r.kind === "mailer");
  const fromCard = reports.filter(r => String(r.source).startsWith("card")).length;
  const when = (d: string) => new Date(d).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const live = clients.filter(c => c.plan !== "free");
  const pill = (st: string) => <span className={`ax-pill ${st}`}>{st.replace("_", " ")}</span>;
  return (
    <main className="ax">
      <AdminNav k={key} on="" />
      <div className="ax-wrap">
      <header className="ax-hello"><h1>Today</h1><p>{new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "long", day: "numeric" })}</p></header>
      <Today k={key!} />
      {msg && <p className="ax-msg">{msg}</p>}

      <section className="ax-sec" id="clients">
        <div className="ax-sechead"><h2>Clients <span>{live.length}</span></h2></div>
        <details className="ax-add">
          <summary>+ Add client</summary>
          <form className="ad-add" method="post" action="/api/admin/client">
            <input type="hidden" name="key" value={key} />
            <input name="business" placeholder="Business name" required />
            <input name="owner" placeholder="Owner name" />
            <input name="email" type="email" placeholder="Owner email" required />
            <input name="phone" placeholder="Owner mobile (optional)" />
            <input name="leadsnap" placeholder="LeadSnap ID, e.g. 105266" inputMode="numeric" />
            <input name="website" placeholder="Website (optional)" />
            <select name="plan" defaultValue="local"><option value="local">Google Management $25</option><option value="site">Website Package</option><option value="pro">Lokly Pro $99</option></select>
            <label className="small"><input type="checkbox" name="send" value="1" defaultChecked /> Email them their sign-in link</label>
            <button className="btn dark sm">Add client</button>
          </form>
        </details>
        {clients.length === 0 && <p className="ax-empty">No clients yet.</p>}
        <div className="ax-list">
        {clients.map(c => {
          const ts = tasksOf(c.id); const open = ts.filter(t => !t.done).length;
          const link = shareUrl(c.id);
          return (
            <article key={c.id} className="ax-client">
              <div className="ax-ctop">
                <div><b>{c.name}</b><small>{c.plan === "local" ? "Google Mgmt" : c.plan === "pro" ? "Pro" : c.plan === "site" ? "Website" : "Free"}{c.leadsnap_id ? ` · LS ${c.leadsnap_id}` : ""}{c.email ? ` · ${c.email}` : ""}</small></div>
                {pill(c.status ?? "pending")}
              </div>
              <div className="ax-actions">
                <a className="ax-btn" href={link} target="_blank" rel="noreferrer">Open results</a>
                <a className="ax-btn ghost" href={`sms:&body=${encodeURIComponent(`Your Google results are live: ${link}\nTip: add it to your home screen so you can check anytime.`)}`}>Text link</a>
                {c.phone && <a className="ax-btn ghost" href={`tel:${c.phone}`}>Call</a>}
              </div>
              <details className="ax-more">
                <summary>Manage{open ? ` · ${open} open task${open > 1 ? "s" : ""}` : ""}</summary>
                <p className="ax-label">Status</p>
                <div className="ad-status">{["pending", "active", "trial", "past_due", "canceled"].map(st => (
                  <form key={st} method="post" action="/api/admin/task"><input type="hidden" name="key" value={key} /><input type="hidden" name="b" value={c.id} /><input type="hidden" name="status" value={st} />
                    <button className={`chip ${c.status === st ? "on" : ""}`}>{st.replace("_", " ")}</button></form>))}</div>
                <p className="ax-label">Paid add-ons</p>
                <div className="ad-status">{["social", "campaigns", "ads", "mailers"].map(a => (
                  <form key={a} method="post" action="/api/admin/task"><input type="hidden" name="key" value={key} /><input type="hidden" name="b" value={c.id} /><input type="hidden" name="addon" value={a} />
                    <button className={`chip ${(c.addons ?? []).includes(a) ? "on" : ""}`}>{a}</button></form>))}</div>
                {ts.length > 0 && <><p className="ax-label">Setup</p>
                <div className="ad-tasks">{ts.map(t => (
                  <form key={t.key} method="post" action="/api/admin/task"><input type="hidden" name="key" value={key} /><input type="hidden" name="b" value={c.id} /><input type="hidden" name="task" value={t.key} />
                    <button className={`chip ${t.done ? "on" : ""}`}>{t.done ? "✓ " : ""}{t.title}</button></form>))}</div></>}
                <p className="ax-label">Log work (shows in their results)</p>
                <form className="ax-form" method="post" action="/api/admin/result">
                  <input type="hidden" name="key" value={key} /><input type="hidden" name="b" value={c.id} />
                  <select name="kind" aria-label="Type">{["Google post", "Review reply", "Social post", "Postcard", "Campaign", "Website", "Ads", "Update"].map(k => <option key={k}>{k}</option>)}</select>
                  <input name="title" placeholder="What we did" required />
                  <input name="detail" placeholder="Result (optional)" />
                  <button className="btn dark sm">Log it</button>
                </form>
                <p className="ax-label">Details</p>
                <form className="ax-form" method="post" action="/api/admin/business">
                  <input type="hidden" name="key" value={key} /><input type="hidden" name="id" value={c.id} />
                  <select name="plan" defaultValue={c.plan} aria-label="Plan"><option value="free">Free</option><option value="local">Google Management</option><option value="pro">Pro</option></select>
                  <input name="leadsnap_id" defaultValue={c.leadsnap_id ?? ""} placeholder="LeadSnap ID" inputMode="numeric" />
                  <input name="stats_url" defaultValue={c.stats_url ?? ""} placeholder="Report link (optional)" />
                  <button className="btn dark sm">Save</button>
                </form>
                {c.setup?.shipTo && <p className="ax-flag">Mail NFC card → {c.setup.shipTo}</p>}
              </details>
            </article>
          );
        })}
        </div>
      </section>

      {signups.length > 0 && <section className="ax-sec"><div className="ax-sechead"><h2>New signups <span>{signups.length}</span></h2></div>
        <div className="ax-list">{signups.map(r => (
          <article key={r.id} className="ax-client">
            <div className="ax-ctop"><div><b>{r.business_name}</b><small>{when(r.created_at)} · {r.plan}{r.contact_name ? ` · ${r.contact_name}` : ""}</small></div></div>
            <div className="ax-actions">{r.phone && <a className="ax-btn" href={`tel:${r.phone}`}>Call {r.phone}</a>}{r.email && <a className="ax-btn ghost" href={`mailto:${r.email}`}>Email</a>}</div>
            {r.data?.nfcCard && <p className="ax-flag">Mail NFC card → {r.data.shipTo}</p>}
          </article>))}</div></section>}

      {mailers.length > 0 && <section className="ax-sec"><div className="ax-sechead"><h2>Postcard requests <span>{mailers.length}</span></h2></div>
        <div className="ax-list">{mailers.map(r => (
          <article key={r.id} className="ax-client">
            <div className="ax-ctop"><div><b>{r.business_name}</b><small>{when(r.created_at)} · {r.plan} · {r.data?.status ?? "new"}</small></div></div>
            <p className="ax-note"><b>{r.data?.headline}</b> {r.data?.detail} · {r.data?.area}</p>
            <div className="ax-actions">
              {r.phone && <a className="ax-btn ghost" href={`tel:${r.phone}`}>Call</a>}
              {r.data?.proofUrl ? <a className="ax-btn ghost" href={r.data.proofUrl} target="_blank" rel="noreferrer">Proof PDF</a>
                : process.env.LOB_API_KEY ? <form method="post" action="/api/admin/proof"><input type="hidden" name="key" value={key} /><input type="hidden" name="lead" value={r.id} /><button className="ax-btn">Make proof</button></form> : null}
              {process.env.SHOPIFY_STORE_DOMAIN && r.data?.qty && <a className="ax-btn ghost" href={`/api/buy?item=mailer_${r.data.qty}&ref=${r.id}`} target="_blank" rel="noreferrer">Pay link</a>}
            </div>
          </article>))}</div></section>}

      {toolReqs.length > 0 && <section className="ax-sec"><div className="ax-sechead"><h2>Tool requests <span>{toolReqs.length}</span></h2></div>
        <div className="ax-rows">{toolReqs.map(r => <div key={r.id}><b>{r.business_name}</b><span>{r.data?.toolName}</span><small>{when(r.created_at)}</small></div>)}</div></section>}

      <section className="ax-sec"><div className="ax-sechead"><h2>Free reports <span>{reports.length}</span></h2><small>{fromCard} from your card</small></div>
        {reports.length === 0 ? <p className="ax-empty">No reports yet.</p> :
        <div className="ax-rows">{reports.slice(0, 30).map(r => (
          <div key={r.id}>
            <b>{r.business_name}</b>
            <span className={`ax-score ${(r.score ?? 0) >= 80 ? "hi" : (r.score ?? 0) >= 60 ? "mid" : "lo"}`}>{r.score ?? "–"}</span>
            <small>{when(r.created_at)} · {String(r.source).replace("card", "business card").replace(":saved", " · saved")}{r.email ? ` · ${r.email}` : ""}</small>
          </div>))}</div>}
      </section>
      </div>
    </main>
  );
}
