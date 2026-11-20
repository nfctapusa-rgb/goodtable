import { db, dbReady } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads | Lokly", robots: { index: false, follow: false } };

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
  return (
    <main className="wrap admin">
      <h1 className="sh-h2">Leads</h1>
      <p><a className="btn dark sm" href={`/admin/posts?key=${encodeURIComponent(key!)}`}>This week's social posts</a> <a className="btn dark sm" href={`/admin/growth?key=${encodeURIComponent(key!)}`}>Growth Center</a> <a className="btn dark sm" href={`/admin/social?key=${encodeURIComponent(key!)}`}>Lokly's socials</a></p>
      <p className="sh-sub">{signups.length} signups · {reports.length} free reports ({fromCard} from your business card)</p>
      {msg && <p className="ok-note" style={{ wordBreak: "break-all" }}>{msg}</p>}
      <h2 className="ad-h" id="clients">Client accounts</h2>
      <form className="card ad-add" method="post" action="/api/admin/client">
        <b>Add an existing client</b>
        <p className="muted small">For clients you already manage. They get a sign-in link to their results app, no password needed.</p>
        <input type="hidden" name="key" value={key} />
        <input name="business" placeholder="Business name" required />
        <input name="owner" placeholder="Owner name" />
        <input name="email" type="email" placeholder="Owner email" required />
        <input name="phone" placeholder="Owner mobile (optional)" />
        <input name="leadsnap" placeholder="LeadSnap ID, e.g. 105266" inputMode="numeric" />
        <input name="website" placeholder="Website (optional)" />
        <select name="plan" defaultValue="local"><option value="local">Google Management $25</option><option value="site">Website Package</option><option value="pro">Lokly Pro $99</option></select>
        <label className="small"><input type="checkbox" name="send" value="1" defaultChecked /> Email them their sign-in link now</label>
        <button className="btn dark sm">Add client</button>
      </form>
      <div className="ad-table">
        <div className="ad-row ad-head c3"><span>Business</span><span>Login email</span><span>Plan, LeadSnap location ID & optional report link</span></div>
        {clients.length === 0 && <p className="ad-empty">No accounts yet. Clients sign up at lokly.pro/signup.</p>}
        {clients.map(c => (
          <form key={c.id} className="ad-row c3" method="post" action="/api/admin/business">
            <span><b>{c.name}</b><small>{when(c.created_at)}</small></span>
            <span>{c.email}</span>
            <span className="ad-edit">
              <input type="hidden" name="key" value={key} /><input type="hidden" name="id" value={c.id} />
              <select name="plan" defaultValue={c.plan} aria-label="Plan"><option value="free">Free</option><option value="local">Google Management</option><option value="pro">Pro</option></select>
              <input name="leadsnap_id" defaultValue={c.leadsnap_id ?? ""} placeholder="LeadSnap ID e.g. 105266" aria-label="LeadSnap location ID" inputMode="numeric" style={{maxWidth:"11rem"}} />
              <input name="stats_url" defaultValue={c.stats_url ?? ""} placeholder="https://… report link (optional)" aria-label="Google stats link" />
              <button className="btn dark sm">Save</button>
            </span>
          </form>
        ))}
      </div>
      <h2 className="ad-h" id="onboarding">Onboarding & results</h2>
      <div className="ad-table">
        {clients.filter(c => c.plan !== "free").map(c => {
          const ts = tasksOf(c.id);
          return (
            <div key={c.id} className="ad-onb">
              <div><b>{c.name}</b> <span className={`st ${c.status === "active" ? "live" : c.status === "trial" ? "managed" : "soon"}`}>{c.status}</span> <small>{c.plan}{c.phone ? ` · ${c.phone}` : ""}{c.email ? ` · ${c.email}` : ""}</small>
                {c.setup?.shipTo && <small style={{ color: "#E30A23", fontWeight: 700 }}>NFC card → {c.setup.shipTo}</small>}
              </div>
              <div className="ad-status">{["pending", "active", "trial", "past_due", "canceled"].map(st => (
                <form key={st} method="post" action="/api/admin/task"><input type="hidden" name="key" value={key} /><input type="hidden" name="b" value={c.id} /><input type="hidden" name="status" value={st} />
                  <button className={`chip ${c.status === st ? "on" : ""}`}>{st}</button></form>))}</div>
              <div className="ad-status">{["social", "campaigns", "ads", "mailers"].map(a => (
                <form key={a} method="post" action="/api/admin/task"><input type="hidden" name="key" value={key} /><input type="hidden" name="b" value={c.id} /><input type="hidden" name="addon" value={a} />
                  <button className={`chip ${(c.addons ?? []).includes(a) ? "on" : ""}`} title="Paid add-on (tap to toggle)">+ {a}</button></form>))}</div>
              <form className="ad-result" method="post" action="/api/admin/result">
                <input type="hidden" name="key" value={key} /><input type="hidden" name="b" value={c.id} />
                <select name="kind" aria-label="Type">{["Google post", "Review reply", "Social post", "Postcard", "Campaign", "Website", "Ads", "Update"].map(k => <option key={k}>{k}</option>)}</select>
                <input name="title" placeholder="What we did, e.g. Posted this week's 10% off offer" required />
                <input name="detail" placeholder="Result (optional), e.g. 312 views, 9 calls" />
                <input name="url" placeholder="Link (optional)" />
                <button className="btn dark sm">Log it</button>
              </form>
              <div className="ad-tasks">{ts.map(t => (
                <form key={t.key} method="post" action="/api/admin/task"><input type="hidden" name="key" value={key} /><input type="hidden" name="b" value={c.id} /><input type="hidden" name="task" value={t.key} />
                  <button className={`chip ${t.done ? "on" : ""}`} title={t.who === "owner" ? "Client task" : "Lokly task"}>{t.done ? "✓ " : ""}{t.title}</button></form>))}</div>
            </div>
          );
        })}
      </div>
      <h2 className="ad-h">Signups to call</h2>
      <div className="ad-table">
        <div className="ad-row ad-head"><span>When</span><span>Business</span><span>Contact</span><span>Plan</span><span>Links & notes</span></div>
        {signups.length === 0 && <p className="ad-empty">No signups yet.</p>}
        {signups.map(r => (
          <div key={r.id} className="ad-row">
            <span>{when(r.created_at)}</span>
            <span><b>{r.business_name}</b>{r.website && <a href={/^https?:/.test(r.website) ? r.website : `https://${r.website}`} target="_blank" rel="noreferrer">{r.website}</a>}</span>
            <span>{r.contact_name}<a href={`tel:${r.phone}`}>{r.phone}</a><a href={`mailto:${r.email}`}>{r.email}</a></span>
            <span>{r.plan}</span>
            <span className="ad-notes">{r.data?.tools?.length > 0 && <span>Wants: {r.data.tools.join(", ")}</span>}{r.data?.nfcCard && <b style={{color:"#E30A23"}}>Mail NFC card → {r.data.shipTo}</b>}{r.data?.googleProfile && <a href={r.data.googleProfile} target="_blank" rel="noreferrer">Google profile</a>}{r.data?.orderLink && <a href={r.data.orderLink} target="_blank" rel="noreferrer">Ordering link</a>}{r.data?.instagram && <span>{r.data.instagram}</span>}{r.data?.notes && <em>{r.data.notes}</em>}</span>
          </div>
        ))}
      </div>
      <h2 className="ad-h" id="mailers">Postcard requests</h2>
      <div className="ad-table">
        <div className="ad-row ad-head"><span>When</span><span>Business</span><span>Contact</span><span>Order</span><span>Offer & area</span></div>
        {mailers.length === 0 && <p className="ad-empty">No postcard requests yet.</p>}
        {mailers.map(r => (
          <div key={r.id} className="ad-row">
            <span>{when(r.created_at)}</span>
            <span><b>{r.business_name}</b><small>{r.data?.address}</small></span>
            <span>{r.contact_name}<a href={`tel:${r.phone}`}>{r.phone}</a><a href={`mailto:${r.email}`}>{r.email}</a></span>
            <span>{r.plan}<small>{r.data?.status}{r.data?.scans ? ` · ${r.data.scans} scans` : ""}</small>
              {process.env.SHOPIFY_STORE_DOMAIN && r.data?.qty && <a href={`/api/buy?item=mailer_${r.data.qty}&ref=${r.id}`} target="_blank" rel="noreferrer" title="Text this to the client after they approve the proof">Shopify pay link</a>}
              {r.data?.proofUrl ? <a href={r.data.proofUrl} target="_blank" rel="noreferrer">View proof PDF</a>
                : process.env.LOB_API_KEY ? <form method="post" action="/api/admin/proof"><input type="hidden" name="key" value={key} /><input type="hidden" name="lead" value={r.id} /><button className="btn dark sm">Make proof</button></form> : <small>Add Lob key for proofs</small>}</span>
            <span className="ad-notes"><b>{r.data?.headline}</b><em>{r.data?.detail}</em><span>{r.data?.area}{r.data?.zips ? `: ${r.data.zips}` : ""}</span></span>
          </div>
        ))}
      </div>
      <h2 className="ad-h">Tool requests</h2>
      <div className="ad-table">
        {toolReqs.length === 0 && <p className="ad-empty">No tool requests yet. Clients request tools from their dashboard.</p>}
        {toolReqs.map(r => (
          <div key={r.id} className="ad-row r4">
            <span>{when(r.created_at)}</span><span><b>{r.business_name}</b></span><span>{r.data?.toolName}</span>
            <span>{r.plan}{r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}</span>
          </div>
        ))}
      </div>
      <h2 className="ad-h">Free reports</h2>
      <div className="ad-table">
        <div className="ad-row ad-head r4"><span>When</span><span>Business</span><span>Score</span><span>Source</span></div>
        {reports.length === 0 && <p className="ad-empty">No reports yet.</p>}
        {reports.map(r => (
          <div key={r.id} className="ad-row r4">
            <span>{when(r.created_at)}</span>
            <span><b>{r.business_name}</b>{r.city && <small>{r.city}</small>}{r.data?.needsGoogleProfile && <small style={{color:"#E5402F",fontWeight:700}}>No Google profile, set one up{r.data.address ? ` · ${r.data.address}` : ""}</small>}{r.website && <a href={r.website} target="_blank" rel="noreferrer">{r.website}</a>}</span>
            <span>{r.score ?? "–"}/100</span>
            <span>{String(r.source).replace("card", "Business card").replace(":saved", " · saved")}{r.email && <a href={`mailto:${r.email}`}>{r.contact_name} {r.email}</a>}{r.phone && <a href={`tel:${r.phone}`}>{r.phone}</a>}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
