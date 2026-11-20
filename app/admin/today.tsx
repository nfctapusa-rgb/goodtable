import { db } from "@/lib/db";
import { PLANS, SITE_MONTHLY_CENTS } from "@/lib/plans";

const n = (v: unknown) => Number(v ?? 0);
const money = (c: number) => `$${Math.round(c / 100).toLocaleString("en-US")}`;

// The top of /admin: what happened today, the week's funnel, and what needs Mark.
export async function Today({ k }: { k: string }) {
  const sql = await db();
  const q = `?key=${encodeURIComponent(k)}`;
  const [d] = await sql`SELECT
      (SELECT count(*) FROM leads WHERE kind = 'report' AND coalesce(source,'') NOT LIKE '%:saved' AND created_at > date_trunc('day', now() AT TIME ZONE 'America/Los_Angeles') AT TIME ZONE 'America/Los_Angeles') AS reports_today,
      (SELECT count(*) FROM leads WHERE kind = 'report' AND coalesce(source,'') NOT LIKE '%:saved' AND created_at > now() - interval '7 days') AS reports_week,
      (SELECT count(*) FROM users WHERE NOT is_admin AND created_at > now() - interval '7 days') AS signups_week,
      (SELECT count(*) FROM funnel_events WHERE event IN ('click','ig_comment') AND created_at > now() - interval '7 days') AS ig_week,
      (SELECT count(*) FROM prospects) AS p_total,
      (SELECT count(*) FROM prospects WHERE status = 'queued') AS p_queued,
      (SELECT count(*) FROM prospects WHERE step > 0) AS p_emailed,
      (SELECT count(*) FROM prospects WHERE status IN ('clicked','report','customer')) AS p_clicked,
      (SELECT count(*) FROM prospects WHERE status IN ('report','customer')) AS p_report,
      (SELECT count(*) FROM prospects WHERE last_sent_at > now() - interval '24 hours') AS sent_today,
      (SELECT coalesce(sum(amount_cents),0) FROM payments WHERE paid_at >= date_trunc('month', now())) AS collected,
      (SELECT count(*) FROM house_posts WHERE status = 'pending' AND scheduled_for > now()) AS house_pending,
      (SELECT count(*) FROM house_posts WHERE status = 'scheduled' AND scheduled_for > now()) AS house_sched` as any[];
  const subs = await sql`SELECT plan, status, trial_ends_at FROM businesses WHERE plan <> 'free' AND status IN ('active','trial','past_due')` as any[];
  const mrr = subs.reduce((a, b) => b.status === "past_due" ? a : b.plan === "site" ? a + (b.status === "trial" ? 0 : SITE_MONTHLY_CENTS) : a + (PLANS.find(p => p.id === b.plan && p.interval === "month")?.cents ?? 0), 0);
  const replies = await sql`SELECT id, business_name, email, status FROM prospects WHERE status IN ('replied','report') ORDER BY coalesce(replied_at, report_at) DESC LIMIT 6` as any[];
  const pending = await sql`SELECT b.name, b.phone, b.created_at, u.email FROM businesses b LEFT JOIN memberships m ON m.business_id = b.id AND m.role = 'owner' LEFT JOIN users u ON u.id = m.user_id WHERE b.status = 'pending' ORDER BY b.created_at DESC LIMIT 6` as any[];
  const pastDue = await sql`SELECT name, phone FROM businesses WHERE status = 'past_due' LIMIT 6` as any[];
  const todo: { t: string; d: string; href?: string }[] = [
    ...pending.map(p => ({ t: `Call new signup: ${p.name}`, d: [p.phone, p.email].filter(Boolean).join(" · "), href: `/admin${q}#clients` })),
    ...replies.map(r => ({ t: r.status === "replied" ? `Reply from ${r.business_name}` : `${r.business_name} ran their report: follow up`, d: r.email, href: `/admin/outreach${q}` })),
    ...pastDue.map(b => ({ t: `Payment failed: ${b.name}`, d: b.phone ?? "", href: `/admin${q}#clients` })),
    ...(n(d.house_pending) ? [{ t: `${n(d.house_pending)} Lokly social posts waiting for your OK`, d: "Approve or skip", href: `/admin/social${q}` }] : []),
  ];
  const card = (label: string, value: string, sub: string, href: string) => (
    <a key={label} href={href} className="card gc-kpi td-kpi"><span>{label}</span><b>{value}</b><small>{sub}</small></a>);
  return (
    <section className="today">
      <div className="gc-kpis">
        {card("Free reports", String(n(d.reports_today)), `today · ${n(d.reports_week)} this week`, `/admin/growth${q}`)}
        {card("Sign-ups", String(n(d.signups_week)), "this week", `/admin${q}#clients`)}
        {card("Emails sent", String(n(d.sent_today)), `last 24h · ${n(d.p_queued)} queued`, `/admin/outreach${q}`)}
        {card("Opened their report", String(n(d.p_clicked)), `of ${n(d.p_emailed)} emailed · ${n(d.p_report)} ran it`, `/admin/outreach${q}`)}
        {card("Paying clients", String(subs.filter(s => s.status === "active").length), `${money(mrr)}/mo · ${money(n(d.collected))} this month`, `/admin/growth${q}`)}
        {card("Lokly posts", String(n(d.house_sched)), `scheduled · ${n(d.ig_week)} IG leads this week`, `/admin/social${q}`)}
      </div>
      <div className="card td-todo">
        <b>Needs you</b>
        {todo.length === 0 ? <p className="muted small">Nothing right now. New signups, replies and failed payments show up here.</p>
          : <ul>{todo.slice(0, 12).map((x, i) => <li key={i}><a href={x.href}>{x.t}</a>{x.d && <small className="muted"> {x.d}</small>}</li>)}</ul>}
      </div>
    </section>
  );
}
