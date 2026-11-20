import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { fullStats, type FullStats } from "@/lib/leadsnap";
import { computeWins, MONTH } from "@/lib/wins";
import { verifyShare } from "@/lib/share";
import { InstallHint } from "../../app/install";

export const dynamic = "force-dynamic";

async function load(t: string) {
  const id = verifyShare(t);
  if (!id) return null;
  const sql = await db();
  const [b] = await sql`SELECT id, name, leadsnap_id, snapshot FROM businesses WHERE id = ${id}` as any[];
  return b ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ t: string }> }): Promise<Metadata> {
  const { t } = await params;
  const b = await load(t);
  return {
    title: b ? `${b.name} · Google results` : "Lokly", robots: { index: false },
    manifest: `/v/${t}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: b?.name?.slice(0, 18) ?? "Lokly", statusBarStyle: "default" },
  };
}

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : n.toLocaleString());

export default async function View({ params }: { params: Promise<{ t: string }> }) {
  const { t } = await params;
  const b = await load(t);
  if (!b) notFound();
  let s: FullStats | null = b.leadsnap_id ? await fullStats(b.leadsnap_id) : null;
  const sql = await db();
  if (s) await sql`UPDATE businesses SET snapshot = ${JSON.stringify(s)}::jsonb WHERE id = ${b.id}`.catch(() => null);
  else s = b.snapshot ?? null;
  const done = await sql`SELECT kind, title, created_at FROM results WHERE business_id = ${b.id} ORDER BY created_at DESC LIMIT 5` as any[];
  const w = s ? computeWins(s) : null;
  const max = Math.max(...(w?.months.map(m => m.v) ?? [1]), 1);
  const best = w?.months.reduce((x, y) => (y.v > x.v ? y : x), w.months[0]);

  return (
    <main className="vw">
      <header className="vw-head">
        <img src="/pin-96.png" alt="" width={28} height={28} />
        <div><p>Your Google results</p><h1>{b.name}</h1></div>
      </header>

      {!w?.hasData ? (
        <section className="vw-card"><b>We're connecting your Google numbers.</b><p className="muted">They'll show up here within 1 business day. Save this page so they're one tap away.</p></section>
      ) : (
        <>
          {w.wins.length > 0 && (
            <section className="vw-wins">
              {w.wins.map(x => <div key={x.text}><strong>{x.big}</strong><span>{x.text}</span></div>)}
            </section>
          )}
          {w.totals.length > 0 && (
            <section className="vw-totals">
              {w.totals.map(x => <div key={x.l}><strong>{fmt(x.n)}</strong><span>{x.l}</span><small>{x.sub}</small></div>)}
            </section>
          )}
          {w.months.length > 1 && (
            <section className="vw-card">
              <b>Google views by month</b>
              <div className="rapp-bars">{w.months.map(m => (
                <div key={m.m}><span className="v">{fmt(m.v)}</span><i style={{ height: `${Math.max(4, (m.v / max) * 100)}%` }} className={m === best ? "best" : ""} /><small>{MONTH(m.m)}</small></div>
              ))}</div>
            </section>
          )}
        </>
      )}

      {done.length > 0 && (
        <section className="vw-card"><b>What we did for you</b>
          <ul className="feed">{done.map((r, i) => <li key={i}><span className="feed-k">{r.kind}</span><div><b>{r.title}</b></div></li>)}</ul>
        </section>
      )}
      <InstallHint />
      <p className="vw-foot">Data from Google Business Profile{s?.asOf ? `, updated ${new Date(s.asOf).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}.<br />Managed by <a href="https://lokly.pro">Lokly</a></p>
    </main>
  );
}
