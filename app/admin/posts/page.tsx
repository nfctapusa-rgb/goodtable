import { db, dbReady } from "@/lib/db";
import { draftsFor } from "@/lib/postdrafts";
import { CopyButton } from "./copy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Post drafts | Lokly", robots: { index: false, follow: false } };

export default async function Posts({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY || !dbReady()) return <main className="narrow"><section className="hero"><h1 className="sh-h2">Not found</h1></section></main>;
  const sql = await db();
  const clients = await sql`SELECT id, name, city, category, place_id, website, assets, setup, plan, status FROM businesses
    WHERE plan IN ('pro', 'local', 'site') AND status <> 'canceled' ORDER BY (plan = 'pro') DESC, name` as any[];
  const all = await Promise.all(clients.map(async c => ({ c, drafts: await draftsFor(c) })));
  return (
    <main className="wrap admin">
      <p><a href={`/admin?key=${encodeURIComponent(key!)}`}>← Leads & clients</a></p>
      <h1 className="sh-h2">This week's posts</h1>
      <p className="sh-sub">For each client: open <a href="https://business.facebook.com/latest/content_calendar" target="_blank" rel="noreferrer">Meta Business Suite Planner</a>, pick their account, and schedule these to Facebook and Instagram. Pro clients first.</p>
      {all.length === 0 && <p className="ad-empty">No active clients yet.</p>}
      {all.map(({ c, drafts }) => (
        <section key={c.id} className="pd-client">
          <h2 className="ad-h">{c.name} <small className="muted">{c.plan}{c.assets?.instagram ? " · IG found" : ""}{c.assets?.facebook ? " · FB found" : ""}</small></h2>
          <div className="pd-grid">
            {drafts.map(d => (
              <article key={d.kind} className="pd">
                <div className="pd-top"><b>{d.kind}</b><span className="muted small">{d.when}</span></div>
                {d.photo ? <a href={d.photo} target="_blank" rel="noreferrer" title="Open photo to save"><img src={d.photo} alt="" loading="lazy" /></a> : <div className="pd-nophoto">No photo yet. Ask the client for photos.</div>}
                <pre>{d.caption}</pre>
                <CopyButton text={d.caption} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
