import { db, dbReady } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads | Lokly", robots: { index: false, follow: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return <main className="narrow"><section className="hero"><h1 className="sh-h2">Not found</h1></section></main>;
  if (!dbReady()) return <main className="narrow"><section className="hero"><p>Database not connected.</p></section></main>;
  const sql = await db();
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 300` as any[];
  const clients = await sql`SELECT b.id, b.name, b.plan, b.stats_url, b.created_at, u.email FROM businesses b
    LEFT JOIN memberships m ON m.business_id = b.id AND m.role = 'owner' LEFT JOIN users u ON u.id = m.user_id ORDER BY b.created_at DESC LIMIT 200` as any[];
  const signups = rows.filter(r => r.kind === "onboarding");
  const reports = rows.filter(r => r.kind === "report");
  const mailers = rows.filter(r => r.kind === "mailer");
  const fromCard = reports.filter(r => String(r.source).startsWith("card")).length;
  const when = (d: string) => new Date(d).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <main className="wrap admin">
      <h1 className="sh-h2">Leads</h1>
      <p className="sh-sub">{signups.length} signups · {reports.length} free reports ({fromCard} from your business card)</p>
      <h2 className="ad-h" id="clients">Client accounts</h2>
      <div className="ad-table">
        <div className="ad-row ad-head c3"><span>Business</span><span>Login email</span><span>Plan & Google stats link (Localo report)</span></div>
        {clients.length === 0 && <p className="ad-empty">No accounts yet. Clients sign up at lokly.pro/signup.</p>}
        {clients.map(c => (
          <form key={c.id} className="ad-row c3" method="post" action="/api/admin/business">
            <span><b>{c.name}</b><small>{when(c.created_at)}</small></span>
            <span>{c.email}</span>
            <span className="ad-edit">
              <input type="hidden" name="key" value={key} /><input type="hidden" name="id" value={c.id} />
              <select name="plan" defaultValue={c.plan} aria-label="Plan"><option value="free">Free</option><option value="local">Google Management</option><option value="pro">Pro</option></select>
              <input name="stats_url" defaultValue={c.stats_url ?? ""} placeholder="https://… Localo report link" aria-label="Google stats link" />
              <button className="btn dark sm">Save</button>
            </span>
          </form>
        ))}
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
            <span className="ad-notes">{r.data?.googleProfile && <a href={r.data.googleProfile} target="_blank" rel="noreferrer">Google profile</a>}{r.data?.orderLink && <a href={r.data.orderLink} target="_blank" rel="noreferrer">Ordering link</a>}{r.data?.instagram && <span>{r.data.instagram}</span>}{r.data?.notes && <em>{r.data.notes}</em>}</span>
          </div>
        ))}
      </div>
      <h2 className="ad-h">Postcard requests</h2>
      <div className="ad-table">
        <div className="ad-row ad-head"><span>When</span><span>Business</span><span>Contact</span><span>Order</span><span>Offer & area</span></div>
        {mailers.length === 0 && <p className="ad-empty">No postcard requests yet.</p>}
        {mailers.map(r => (
          <div key={r.id} className="ad-row">
            <span>{when(r.created_at)}</span>
            <span><b>{r.business_name}</b><small>{r.data?.address}</small></span>
            <span>{r.contact_name}<a href={`tel:${r.phone}`}>{r.phone}</a><a href={`mailto:${r.email}`}>{r.email}</a></span>
            <span>{r.plan}<small>{r.data?.status}</small></span>
            <span className="ad-notes"><b>{r.data?.headline}</b><em>{r.data?.detail}</em><span>{r.data?.area}{r.data?.zips ? `: ${r.data.zips}` : ""}</span></span>
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
            <span><b>{r.business_name}</b>{r.city && <small>{r.city}</small>}{r.website && <a href={r.website} target="_blank" rel="noreferrer">{r.website}</a>}</span>
            <span>{r.score ?? "–"}/100</span>
            <span>{String(r.source).replace("card", "Business card").replace(":saved", " · saved")}{r.email && <a href={`mailto:${r.email}`}>{r.contact_name} {r.email}</a>}{r.phone && <a href={`tel:${r.phone}`}>{r.phone}</a>}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
