import { db, dbReady } from "@/lib/db";
import { AdminNav } from "../nav";
import { currentUser } from "@/lib/auth";
import { PLANS, SITE_MONTHLY_CENTS } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Growth Center | Lokly", robots: { index: false, follow: false } };

const RANGES = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days", all: "All time" } as const;
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "—");
const n = (v: unknown) => Number(v ?? 0);

// Private: an admin account (users.is_admin) or ?key=ADMIN_KEY, same as the leads page.
export default async function Growth({ searchParams }: { searchParams: Promise<{ key?: string; r?: string }> }) {
  const { key, r } = await searchParams;
  const user = dbReady() ? await currentUser().catch(() => null) : null;
  const allowed = user?.is_admin || (!!process.env.ADMIN_KEY && key === process.env.ADMIN_KEY);
  if (!allowed) return <main className="narrow"><section className="hero"><h1 className="sh-h2">Not found</h1></section></main>;
  if (!dbReady()) return <main className="narrow"><section className="hero"><p>Database not connected.</p></section></main>;

  const range = (r && r in RANGES ? r : "30") as keyof typeof RANGES;
  const days = range === "all" ? 36500 : Number(range);
  const sql = await db();
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const q = (extra: Record<string, string>) => `?${new URLSearchParams({ ...(key ? { key } : {}), ...extra })}`;

  const [ev] = await sql`SELECT
      count(*) FILTER (WHERE event = 'ig_comment') AS comments,
      count(*) FILTER (WHERE event = 'click') AS clicks,
      count(*) FILTER (WHERE event = 'paid') AS paid_events,
      count(*) FILTER (WHERE event = 'canceled') AS canceled,
      count(*) FILTER (WHERE event = 'payment_failed') AS failed
    FROM funnel_events WHERE created_at >= ${since}` as any[];
  // Grader completions and email leads come from the leads table so history from before this dashboard counts too.
  const [ld] = await sql`SELECT
      count(*) FILTER (WHERE kind = 'report' AND coalesce(source,'') NOT LIKE '%:saved') AS grades,
      count(DISTINCT lower(email)) FILTER (WHERE email IS NOT NULL) AS email_leads
    FROM leads WHERE created_at >= ${since}` as any[];
  const [rg] = await sql`SELECT count(*) AS regs FROM users WHERE created_at >= ${since} AND NOT is_admin` as any[];
  const [nw] = await sql`SELECT count(DISTINCT business_id) AS n FROM funnel_events WHERE event = 'paid' AND created_at >= ${since}` as any[];
  const subs = await sql`SELECT id, plan, status, trial_ends_at FROM businesses WHERE plan <> 'free' AND status IN ('active','trial','past_due')` as any[];
  const [rev] = await sql`SELECT
      coalesce(sum(amount_cents) FILTER (WHERE paid_at >= date_trunc('month', now() AT TIME ZONE 'America/Los_Angeles')), 0) AS month,
      coalesce(sum(amount_cents) FILTER (WHERE paid_at >= ${since}), 0) AS range
    FROM payments` as any[];
  const bySource = await sql`WITH s AS (
      SELECT coalesce(source,'direct') AS src, event AS ev FROM funnel_events WHERE created_at >= ${since} AND event IN ('ig_comment','click','paid')
      UNION ALL SELECT split_part(coalesce(source,'web'), ':', 1), 'grade' FROM leads WHERE created_at >= ${since} AND kind = 'report' AND coalesce(source,'') NOT LIKE '%:saved'
      UNION ALL SELECT coalesce(source,'direct'), 'register' FROM users WHERE created_at >= ${since} AND NOT is_admin)
    SELECT src, count(*) FILTER (WHERE ev IN ('ig_comment','click')) AS leads, count(*) FILTER (WHERE ev = 'grade') AS grades,
      count(*) FILTER (WHERE ev = 'register') AS regs, count(*) FILTER (WHERE ev = 'paid') AS paid
    FROM s GROUP BY src ORDER BY count(*) DESC LIMIT 20` as any[];
  const daily = await sql`WITH d AS (SELECT generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') AS day)
    SELECT to_char(d.day, 'Mon DD') AS label,
      (SELECT count(*) FROM leads l WHERE l.kind = 'report' AND coalesce(l.source,'') NOT LIKE '%:saved' AND date_trunc('day', l.created_at) = d.day) AS grades,
      (SELECT count(*) FROM users u WHERE NOT u.is_admin AND date_trunc('day', u.created_at) = d.day) AS regs,
      (SELECT count(*) FROM funnel_events f WHERE f.event = 'paid' AND date_trunc('day', f.created_at) = d.day) AS paid
    FROM d ORDER BY d.day` as any[];
  const recent = await sql`SELECT u.email, u.source, u.created_at,
      (SELECT string_agg(b.name || ' · ' || b.plan || '/' || b.status, ', ') FROM memberships m JOIN businesses b ON b.id = m.business_id WHERE m.user_id = u.id) AS biz
    FROM users u WHERE NOT u.is_admin ORDER BY u.created_at DESC LIMIT 15` as any[];

  // MRR from current subscriptions: monthly plans at list price; Website Package counts $25/mo once its free months end.
  const now = Date.now();
  const mrr = subs.reduce((a, b) => {
    if (b.status === "past_due") return a;
    if (b.plan === "site") return a + (b.status === "trial" || (b.trial_ends_at && new Date(b.trial_ends_at).getTime() > now) ? 0 : SITE_MONTHLY_CENTS);
    const p = PLANS.find(p => p.id === b.plan);
    return a + (p && p.interval === "month" ? p.cents : 0);
  }, 0);
  const paying = subs.filter(b => b.status === "active").length, trials = subs.filter(b => b.status === "trial").length, pastDue = subs.filter(b => b.status === "past_due").length;

  const leads = n(ev.comments) + n(ev.clicks), grades = n(ld.grades), regs = n(rg.regs), newPaid = n(nw.n);
  const max = Math.max(1, ...daily.map(d => n(d.grades)));
  const kpis: [string, string, string?][] = [
    ["Instagram leads", String(leads), `${n(ev.comments)} GRADE comments · ${n(ev.clicks)} link clicks`],
    ["Grader completions", String(grades), `${n(ld.email_leads)} left an email`],
    ["Registrations", String(regs), `${pct(regs, grades)} of graders`],
    ["New paid", String(newPaid), `${pct(newPaid, regs)} of registrations`],
    ["Paid subscribers", String(paying), `${trials} in free months · ${pastDue} past due`],
    ["MRR", money(mrr), `${money(n(rev.month))} collected this month`],
  ];

  return (
    <main className="wrap admin growth">
      <AdminNav k={key} on="/growth" />
      <div className="gc-top">
        <h1 className="sh-h2">Growth Center</h1>
        <nav className="gc-range" aria-label="Date range">
          {Object.entries(RANGES).map(([k, l]) => <a key={k} href={q({ r: k })} className={k === range ? "on" : ""}>{l}</a>)}
        </nav>
      </div>

      <div className="gc-kpis">
        {kpis.map(([l, v, s]) => <div key={l} className="card gc-kpi"><span>{l}</span><b>{v}</b>{s && <small>{s}</small>}</div>)}
      </div>

      <h2 className="ad-h">Funnel · {RANGES[range].toLowerCase()}</h2>
      <div className="card gc-funnel">
        {([["Instagram leads", leads], ["Grader completions", grades], ["Registrations", regs], ["Paid", newPaid]] as [string, number][]).map(([l, v], i, a) => (
          <div key={l} className="gc-step">
            <div className="gc-bar"><i style={{ width: `${a[0][1] || grades ? Math.max(3, (v / Math.max(a[0][1], grades, 1)) * 100) : 0}%` }} /></div>
            <span><b>{v}</b> {l}{i > 0 && <em> · {pct(v, a[i - 1][1])} from previous step</em>}</span>
          </div>
        ))}
        <p className="tiny muted">Instagram leads only count people who came through ManyChat; graders also include website, email and business-card traffic. {n(ev.canceled)} cancellations and {n(ev.failed)} failed payments in this range. {money(n(rev.range))} collected in this range.</p>
      </div>

      <h2 className="ad-h">Last 30 days</h2>
      <div className="card gc-chart" role="img" aria-label="Daily grader completions, registrations and new paid subscribers for the last 30 days">
        {daily.map(d => (
          <div key={d.label} className="gc-day" title={`${d.label}: ${n(d.grades)} graded, ${n(d.regs)} registered, ${n(d.paid)} paid`}>
            <i className="g" style={{ height: `${(n(d.grades) / max) * 100}%` }} />
            <i className="r" style={{ height: `${(n(d.regs) / max) * 100}%` }} />
            <i className="p" style={{ height: `${(n(d.paid) / max) * 100}%` }} />
          </div>
        ))}
        <div className="gc-legend"><span><i className="g" />Graded</span><span><i className="r" />Registered</span><span><i className="p" />Paid</span></div>
      </div>

      <h2 className="ad-h">By source</h2>
      <div className="ad-table gc-table">
        <div className="ad-row ad-head"><span>Source</span><span>IG leads</span><span>Graded</span><span>Registered</span><span>Paid</span><span>Grade → account</span></div>
        {bySource.length === 0 && <p className="ad-empty">No activity in this range yet.</p>}
        {bySource.map(s => (
          <div key={s.src} className="ad-row"><span><b>{s.src}</b></span><span>{n(s.leads)}</span><span>{n(s.grades)}</span><span>{n(s.regs)}</span><span>{n(s.paid)}</span><span>{pct(n(s.regs), n(s.grades))}</span></div>
        ))}
      </div>

      <h2 className="ad-h">Newest accounts</h2>
      <div className="ad-table gc-table gc-recent">
        {recent.map(u => (
          <div key={u.email} className="ad-row"><span><b>{u.email}</b><small>{new Date(u.created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></span><span>{u.source ?? "direct"}</span><span>{u.biz ?? "—"}</span></div>
        ))}
      </div>
      <p className="small muted"><a href={`/admin${key ? `?key=${encodeURIComponent(key)}` : ""}`}>← Leads and client accounts</a></p>
    </main>
  );
}
