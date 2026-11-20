import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { googleStats } from "@/lib/leadsnap";
import { InstallHint } from "./install";

export const dynamic = "force-dynamic";
export const metadata = { title: "My results | Lokly", appleWebApp: { capable: true, title: "Lokly", statusBarStyle: "default" } };

const fmt = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();
const MONTH = (p: string) => new Date(p + "-02").toLocaleString("en-US", { month: "short" });

// Owner results app. Leads with real wins: metrics that grew, best month vs first month on record,
// reviews. Every number is Google's data via LeadSnap; nothing is invented.
export default async function ResultsApp({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/app");
  const { b } = await searchParams;
  const sql = await db();
  const bizList = await sql`SELECT b.id, b.name, b.leadsnap_id, b.plan FROM businesses b JOIN memberships m ON m.business_id = b.id WHERE m.user_id = ${user.id} ORDER BY b.created_at` as any[];
  if (!bizList.length) redirect("/dashboard");
  const biz = bizList.find(x => x.id === b) ?? bizList[0];
  const gs = biz.leadsnap_id ? await googleStats(biz.leadsnap_id) : null;
  const done = await sql`SELECT kind, title, detail, created_at FROM results WHERE business_id = ${biz.id} ORDER BY created_at DESC LIMIT 6` as any[];

  const metrics = gs ? ([["Times you showed up on Google", gs.appearances], ["Calls from Google", gs.calls], ["Calls, website clicks & directions", gs.actions]] as const) : [];
  const months = (gs?.trend ?? []).map(t => ({ m: MONTH(t.period), v: t.maps + t.search }));
  const first = months.find(x => x.v > 0), best = months.reduce((a, x) => (x.v > (a?.v ?? 0) ? x : a), months[0]);
  const longRun = first && best && best !== first && first.v > 0 ? Math.round(((best.v - first.v) / first.v) * 100) : null;
  const wins: string[] = [];
  for (const [label, k] of metrics) if ((k.change_pct ?? 0) > 0) wins.push(`${label} up ${k.change_pct}% this month`);
  if (longRun && longRun > 0) wins.push(`${best.m} was your best month on Google, ${longRun}% above ${first!.m}`);
  if (gs?.reviews && gs.reviews.rating >= 4.5) wins.push(`${gs.reviews.rating.toFixed?.(1) ?? gs.reviews.rating}★ across ${gs.reviews.count} Google reviews`);
  const max = Math.max(...months.map(x => x.v), 1);

  return (
    <main className="rapp">
      <header className="rapp-head">
        <p>Your results</p>
        <h1>{biz.name}</h1>
        {bizList.length > 1 && <nav>{bizList.map(x => <a key={x.id} className={`chip ${x.id === biz.id ? "on" : ""}`} href={`/app?b=${x.id}`}>{x.name}</a>)}</nav>}
      </header>

      {!gs ? (
        <section className="rapp-card"><b>We're connecting your Google numbers.</b><p className="muted">They'll show up here within 1 business day.</p></section>
      ) : (
        <>
          {wins.length > 0 && (
            <section className="rapp-wins">
              {wins.slice(0, 3).map(w => <p key={w}><span aria-hidden="true">▲</span> {w}</p>)}
            </section>
          )}
          <section className="rapp-kpis">
            {metrics.map(([label, k]) => (
              <div key={label}>
                <strong>{fmt(k.current ?? 0)}</strong>
                <span>{label}</span>
                {(k.change_pct ?? 0) > 0 ? <em className="up">▲ {k.change_pct}%</em> : <em className="flat">last 30 days</em>}
              </div>
            ))}
          </section>
          {months.length > 0 && (
            <section className="rapp-card">
              <b>Google views by month</b>
              <div className="rapp-bars">{months.map((x, i) => (
                <div key={x.m + i}><span className="v">{fmt(x.v)}</span><i style={{ height: `${Math.max(4, (x.v / max) * 100)}%` }} className={x === best ? "best" : ""} /><small>{x.m}</small></div>
              ))}</div>
            </section>
          )}
          {gs.reviews && <section className="rapp-card rapp-rev"><strong>{gs.reviews.rating?.toFixed?.(1) ?? gs.reviews.rating}★</strong><span>{gs.reviews.count} Google reviews{gs.reviews.unreplied ? `, ${gs.reviews.unreplied} waiting for a reply` : ", every one answered"}</span></section>}
        </>
      )}

      {done.length > 0 && (
        <section className="rapp-card">
          <b>What we did for you</b>
          <ul className="feed">{done.map((r, i) => <li key={i}><span className="feed-k">{r.kind}</span><div><b>{r.title}</b>{r.detail && <p className="muted small">{r.detail}</p>}</div></li>)}</ul>
        </section>
      )}
      <InstallHint />
      <p className="rapp-foot"><a href={`/dashboard?b=${biz.id}`}>Full dashboard</a> · Data from Google Business Profile, updated daily.</p>
    </main>
  );
}
