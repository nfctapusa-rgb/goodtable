import { db, dbReady } from "@/lib/db";
import { preview, postalAddress, DAILY_CAP } from "@/lib/outreach";

export const dynamic = "force-dynamic";
export const metadata = { title: "Outreach | Lokly", robots: { index: false, follow: false } };

const LABEL: Record<string, string> = { new: "New", queued: "Queued", emailed: "Emailed", clicked: "Opened report link", report: "Ran report", replied: "Replied", customer: "Customer", finished: "Sequence done", unsubscribed: "Unsubscribed", bounced: "Bounced" };

export default async function Outreach({ searchParams }: { searchParams: Promise<{ key?: string; msg?: string; s?: string }> }) {
  const { key, msg, s } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY || !dbReady()) return <main className="narrow"><section className="hero"><h1 className="sh-h2">Not found</h1></section></main>;
  const sql = await db();
  const counts = Object.fromEntries((await sql`SELECT status, count(*)::int n FROM prospects GROUP BY status` as any[]).map(r => [r.status, r.n]));
  const total = Object.values(counts).reduce((a: number, n: any) => a + n, 0) as number;
  const sent = await sql`SELECT count(*)::int n FROM prospects WHERE step > 0` as any[];
  const rows = await sql`SELECT * FROM prospects WHERE ${s ?? ""} = '' OR status = ${s ?? ""} ORDER BY COALESCE(report_at, clicked_at, last_sent_at, created_at) DESC LIMIT 200` as any[];
  const dnc = await sql`SELECT count(*)::int n FROM suppressions` as any[];
  const ready = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM && !!postalAddress();
  const sample = preview(rows[0] ?? { id: 0, business_name: "Main St. Cuts", contact_name: "Alex Rivera", city: "Downtown LA", category: "barbershops" });
  const k = encodeURIComponent(key!);
  const funnel: [string, number][] = [["Leads", total], ["Emailed", sent[0].n], ["Opened report link", (counts.clicked ?? 0) + (counts.report ?? 0) + (counts.customer ?? 0)], ["Ran report", (counts.report ?? 0) + (counts.customer ?? 0)], ["Customers", counts.customer ?? 0]];
  return (
    <main className="wrap admin">
      <p><a href={`/admin?key=${k}`}>← Leads & clients</a></p>
      <h1 className="sh-h2">Outreach</h1>
      <p className="sh-sub">Import leads, send a personal 3-email sequence that points them to their free Google report, and see who turns into a customer.</p>
      {msg && <p className="ok-note">{msg}</p>}
      {!ready && <p className="err-note">Sending is off until these are set in Vercel: {[!process.env.RESEND_API_KEY && "RESEND_API_KEY", !process.env.EMAIL_FROM && "EMAIL_FROM", !postalAddress() && "BUSINESS_POSTAL_ADDRESS (required by law in marketing emails)"].filter(Boolean).join(", ")}. You can import and preview now.</p>}

      <div className="ob-funnel">{funnel.map(([l, n], i) => <div key={l}><strong>{n}</strong><span>{l}</span>{i > 0 && funnel[i - 1][1] > 0 && <em>{Math.round((n / funnel[i - 1][1]) * 100)}%</em>}</div>)}</div>

      <div className="ob-grid">
        <form className="card" method="post" action="/api/admin/outreach" encType="multipart/form-data">
          <b>1. Import leads</b>
          <p className="muted small">CSV with a header row. Needs <code>email</code> and a business name column. Optional: contact, phone, website, city, category, sms_consent (yes/no, only if they actually opted in).</p>
          <input type="hidden" name="key" value={key} /><input type="hidden" name="action" value="import" />
          <input type="file" name="file" accept=".csv,text/csv" />
          <textarea name="csv" rows={4} placeholder={"business,email,contact,city,category\nMain St. Cuts,alex@mainstcuts.com,Alex,Downtown LA,barbershop"} />
          <input name="source" placeholder="Where these came from, e.g. Apollo list Nov" required />
          <button className="btn dark sm">Import</button>
        </form>
        <div className="card">
          <b>2. Start the sequence</b>
          <p className="muted small">Day 0 intro, day 3 follow-up, day 8 last note. Stops the moment someone clicks, runs their report, replies, unsubscribes or bounces. Sends at most {DAILY_CAP()} a weekday, 8 AM Pacific, to keep your domain out of spam.</p>
          <form method="post" action="/api/admin/outreach"><input type="hidden" name="key" value={key} /><input type="hidden" name="action" value="start" /><button className="btn dark sm">Queue all {counts.new ?? 0} new leads</button></form>
          <form method="post" action="/api/admin/outreach" style={{ marginTop: 8 }}><input type="hidden" name="key" value={key} /><input type="hidden" name="action" value="send" /><button className="btn ghost sm" disabled={!ready}>Send today's batch now</button></form>
          <form method="post" action="/api/admin/outreach" style={{ marginTop: 14 }}>
            <input type="hidden" name="key" value={key} /><input type="hidden" name="action" value="dnc" />
            <p className="small"><b>Do-not-contact list</b> ({dnc[0].n})</p>
            <textarea name="emails" rows={2} placeholder="Paste emails to never contact" /><button className="btn ghost sm">Add</button>
          </form>
        </div>
        <div className="card ob-preview">
          <b>Email preview</b>
          <p className="small"><b>Subject:</b> {sample.subject}</p>
          <iframe title="Email preview" srcDoc={sample.html} />
        </div>
      </div>

      <div className="ob-filter">{["", "queued", "emailed", "clicked", "report", "replied", "customer", "unsubscribed", "bounced"].map(f => <a key={f} className={`chip ${(s ?? "") === f ? "on" : ""}`} href={`/admin/outreach?key=${k}${f ? `&s=${f}` : ""}`}>{f ? `${LABEL[f]} (${counts[f] ?? 0})` : `All (${total})`}</a>)}</div>
      <div className="ad-table">
        {rows.length === 0 && <p className="ad-empty">No leads yet. Import a CSV above.</p>}
        {rows.map(p => (
          <div key={p.id} className="ad-row r4">
            <span><b>{p.business_name}</b><small>{[p.contact_name, p.city, p.category].filter(Boolean).join(" · ")}</small></span>
            <span><a href={`mailto:${p.email}`}>{p.email}</a><small>{p.source}{p.sms_consent ? " · SMS consent" : ""}</small></span>
            <span><b>{LABEL[p.status] ?? p.status}</b><small>{p.step > 0 ? `${p.step} of 3 sent` : "Not sent"}{p.score != null ? ` · scored ${p.score}` : ""}{p.notes ? ` · ${p.notes}` : ""}</small></span>
            <span className="ob-act">{["replied", "customer", "dnc"].map(to => (
              <form key={to} method="post" action="/api/admin/outreach"><input type="hidden" name="key" value={key} /><input type="hidden" name="action" value="status" /><input type="hidden" name="id" value={p.id} /><input type="hidden" name="to" value={to} />
                <button className="chip">{to === "dnc" ? "Do not contact" : `Mark ${to}`}</button></form>))}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
