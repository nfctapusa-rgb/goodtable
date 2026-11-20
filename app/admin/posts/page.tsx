import { db, dbReady } from "@/lib/db";
import { AdminNav } from "../nav";
import { draftsFor } from "@/lib/postdrafts";
import { CopyButton } from "./copy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Post drafts | Lokly", robots: { index: false, follow: false } };

export default async function Posts({ searchParams }: { searchParams: Promise<{ key?: string; ok?: string; err?: string }> }) {
  const { key, ok, err } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY || !dbReady()) return <main className="narrow"><section className="hero"><h1 className="sh-h2">Not found</h1></section></main>;
  const sql = await db();
  const clients = await sql`SELECT id, name, city, category, place_id, website, assets, setup, plan, status, social, addons FROM businesses
    WHERE (plan = 'pro' OR addons ? 'social') AND status <> 'canceled' ORDER BY (plan = 'pro') DESC, name` as any[];
  const all = await Promise.all(clients.map(async c => ({ c, drafts: await draftsFor(c) })));
  return (
    <main className="wrap admin">
      <AdminNav k={key} on="/posts" />
      <p><a href={`/admin?key=${encodeURIComponent(key!)}`}>← Leads & clients</a></p>
      <h1 className="sh-h2">This week's posts</h1>
      <p className="sh-sub">For each client: open <a href="https://business.facebook.com/latest/content_calendar" target="_blank" rel="noreferrer">Meta Business Suite Planner</a>, pick their account, and schedule these to Facebook and Instagram. Clients with auto-posting get a one-click Schedule button.</p>
      <form method="get" action="/api/cron/weekly" target="_blank"><input type="hidden" name="key" value={key} /><button className="btn dark sm">Run this week's autopilot now</button></form>
      {ok && <p className="ok-note">Scheduled, and added to the client's results feed.</p>}
      {err && <p className="err-note">{err}</p>}
      {all.length === 0 && <p className="ad-empty">No active clients yet.</p>}
      {all.map(({ c, drafts }) => (
        <section key={c.id} className="pd-client">
          <h2 className="ad-h">{c.name} <small className="muted">{c.social?.profileKey ? "auto-posting on · " : "manual (Meta Planner) · "}{c.plan}{c.assets?.instagram ? " · IG found" : ""}{c.assets?.facebook ? " · FB found" : ""}</small></h2>
          <div className="pd-grid">
            {drafts.map(d => (
              <article key={d.kind} className="pd">
                <div className="pd-top"><b>{d.kind}</b><span className="muted small">{d.when}</span></div>
                {d.photo ? <a href={d.photo} target="_blank" rel="noreferrer" title="Open photo to save"><img src={d.photo} alt="" loading="lazy" /></a> : <div className="pd-nophoto">No photo yet. Ask the client for photos.</div>}
                <pre>{d.caption}</pre>
                <div className="pd-actions"><CopyButton text={d.caption} />
                  {c.social?.profileKey && (
                    <form method="post" action="/api/admin/schedule">
                      <input type="hidden" name="key" value={key} /><input type="hidden" name="b" value={c.id} />
                      <input type="hidden" name="text" value={d.caption} /><input type="hidden" name="photo" value={d.photo ?? ""} /><input type="hidden" name="label" value={`${d.kind} post`} />
                      <button className="btn lime sm">Schedule to IG + FB</button>
                    </form>
                  )}</div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
