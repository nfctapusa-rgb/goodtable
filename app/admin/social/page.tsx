import { db, dbReady } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { ayrshareReady } from "@/lib/ayrshare";
import { getHouse, houseLinked, HOUSE_NETWORKS } from "@/lib/house";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lokly socials | Lokly", robots: { index: false, follow: false } };

const LABEL: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };
const when = (d: string) => new Date(d).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function Social({ searchParams }: { searchParams: Promise<{ key?: string; ok?: string; err?: string }> }) {
  const { key, ok, err } = await searchParams;
  const user = dbReady() ? await currentUser().catch(() => null) : null;
  if (!user?.is_admin && !(process.env.ADMIN_KEY && key === process.env.ADMIN_KEY)) return <main className="narrow"><section className="hero"><h1 className="sh-h2">Not found</h1></section></main>;
  const sql = await db();
  const house = await getHouse();
  const linked = await houseLinked();
  const posts = await sql`SELECT * FROM house_posts WHERE scheduled_for > now() - interval '14 days' AND status <> 'skipped' ORDER BY scheduled_for DESC LIMIT 30` as any[];
  const K = () => key ? <input type="hidden" name="key" value={key} /> : null;
  return (
    <main className="wrap admin">
      <p><a href={`/admin${key ? `?key=${encodeURIComponent(key)}` : ""}`}>← Leads & clients</a></p>
      <h1 className="sh-h2">Lokly's socials</h1>
      {ok && <p className="ok-note">Done.</p>}{err && <p className="err-note">{err}</p>}
      {!ayrshareReady() && <p className="err-note">AYRSHARE_API_KEY isn't set in Vercel.</p>}

      <div className="card">
        <p className="eyebrow">Accounts</p>
        <p>{HOUSE_NETWORKS.map(n => <span key={n} className={`st ${linked.includes(n) ? "live" : "soon"}`} style={{ marginRight: 8 }}>{LABEL[n]} {linked.includes(n) ? "connected" : "not connected"}</span>)}</p>
        <form method="post" action="/api/admin/social" style={{ display: "inline" }}><K /><input type="hidden" name="action" value="connect" /><button className="btn dark sm">{linked.length ? "Manage connected accounts" : "Connect Instagram, Facebook & TikTok"}</button></form>{" "}
        <form method="post" action="/api/admin/social" style={{ display: "inline" }}><K /><input type="hidden" name="action" value="autopilot" /><input type="hidden" name="on" value={house.autopilot ? "0" : "1"} /><button className="btn ghost sm" style={{ width: "auto" }}>{house.autopilot ? "Autopilot ON: posts go out automatically (turn off)" : "Autopilot OFF: I approve each post (turn on)"}</button></form>
        <p className="small muted">Instagram must be a Business or Creator account linked to a Facebook Page. Every Monday, 3 posts are drafted that push the free grader (Comment GRADE), at Mon 11am, Wed 6pm and Fri 12pm.</p>
      </div>

      <h2 className="ad-h">Post something now</h2>
      <form method="post" action="/api/admin/social" className="card form"><K /><input type="hidden" name="action" value="custom" />
        <label>Image headline<input name="head" placeholder="Is your shop invisible on Google?" maxLength={90} /></label>
        <label>Image subline<input name="sub" placeholder="Free report in 60 seconds" maxLength={90} /></label>
        <label>Caption<textarea name="caption" required rows={5} placeholder="Comment GRADE and we'll DM you a free Google report…" style={{ font: "inherit", padding: 12, borderRadius: 10, border: "1px solid var(--line)" }} /></label>
        <label>When (LA time, blank = in 20 minutes)<input type="datetime-local" name="when" /></label>
        <p>{HOUSE_NETWORKS.map(n => <label key={n} style={{ marginRight: 14 }}><input type="checkbox" name={`p_${n}`} defaultChecked /> {LABEL[n]}</label>)}</p>
        <button className="btn dark sm">Schedule post</button>
      </form>

      <h2 className="ad-h">This week's posts</h2>
      <form method="post" action="/api/admin/social"><K /><input type="hidden" name="action" value="draft" /><button className="btn dark sm">Draft this week's 3 posts now</button></form>
      {posts.length === 0 && <p className="ad-empty">Nothing drafted yet.</p>}
      <div className="pd-grid">
        {posts.map(p => (
          <form key={p.id} method="post" action="/api/admin/social" className="pd card"><K /><input type="hidden" name="id" value={p.id} />
            <div className="pd-top"><b>{p.kind.replace(/ \d{6,}$/, "")}</b><span className="muted small">{when(p.scheduled_for)} · {p.status}</span></div>
            {p.image && <img src={p.image} alt="" style={{ width: "100%", borderRadius: 10 }} loading="lazy" />}
            <textarea name="caption" defaultValue={p.caption} rows={6} disabled={p.status === "scheduled"} style={{ width: "100%", font: "inherit", padding: 10, borderRadius: 10, border: "1px solid var(--line)" }} />
            <p className="small">{HOUSE_NETWORKS.map(n => <label key={n} style={{ marginRight: 10 }}><input type="checkbox" name={`p_${n}`} defaultChecked={(p.platforms ?? []).includes(n)} disabled={p.status === "scheduled"} /> {LABEL[n]}</label>)}</p>
            {p.error && <p className="err small">{p.error}</p>}
            {p.status !== "scheduled" && <p><button className="btn dark sm" name="action" value="approve">Approve & schedule</button> <button className="btn ghost sm" style={{ width: "auto" }} name="action" value="skip">Skip</button></p>}
          </form>
        ))}
      </div>
    </main>
  );
}
