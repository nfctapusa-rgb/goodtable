import { db, dbReady } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads | Lokly", robots: { index: false, follow: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return <main className="narrow"><section className="hero"><h1 className="sh-h2">Not found</h1></section></main>;
  if (!dbReady()) return <main className="narrow"><section className="hero"><p>Database not connected.</p></section></main>;
  const sql = await db();
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 300` as any[];
  const signups = rows.filter(r => r.kind === "onboarding");
  const reports = rows.filter(r => r.kind === "report");
  const fromCard = reports.filter(r => r.source === "card").length;
  const when = (d: string) => new Date(d).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <main className="wrap admin">
      <h1 className="sh-h2">Leads</h1>
      <p className="sh-sub">{signups.length} signups · {reports.length} free reports ({fromCard} from your business card)</p>
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
      <h2 className="ad-h">Free reports</h2>
      <div className="ad-table">
        <div className="ad-row ad-head r4"><span>When</span><span>Business</span><span>Score</span><span>Source</span></div>
        {reports.length === 0 && <p className="ad-empty">No reports yet.</p>}
        {reports.map(r => (
          <div key={r.id} className="ad-row r4">
            <span>{when(r.created_at)}</span>
            <span><b>{r.business_name}</b>{r.city && <small>{r.city}</small>}{r.website && <a href={r.website} target="_blank" rel="noreferrer">{r.website}</a>}</span>
            <span>{r.score ?? "–"}/100</span>
            <span>{r.source === "card" ? "Business card" : r.source}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
