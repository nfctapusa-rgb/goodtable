import { redirect } from "next/navigation";
import { googleStats } from "@/lib/leadsnap";
import { MARKETING_TOOLS, STATUS_LABEL } from "@/lib/tools";
import { servicesFor } from "@/lib/accounts";
import { planById } from "@/lib/plans";
import { db, dbReady } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { RescanButton, BizSwitcher } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard | Lokly" };


export default async function Dashboard({ searchParams }: { searchParams: Promise<{ b?: string; requested?: string; upgraded?: string; billing?: string; social?: string; invited?: string }> }) {
  if (!dbReady()) return <main className="narrow"><section className="hero"><h1>Dashboard</h1><p className="note">The database isn't connected yet. Add a Postgres database to this Vercel project to turn on accounts.</p></section></main>;
  const user = await currentUser();
  if (!user) redirect("/login");
  const sql = await db();
  const bizList = await sql`SELECT b.id, b.name, b.plan, b.website, b.address, b.place_id, b.stats_url, b.leadsnap_id, b.status, b.trial_ends_at, b.stripe_customer_id, b.assets, b.addons, b.social FROM businesses b
    JOIN memberships m ON m.business_id = b.id WHERE m.user_id = ${user.id} ORDER BY b.created_at`;
  const { b, requested, upgraded, billing, social, invited } = await searchParams;
  const managerEmail = process.env.GBP_MANAGER_EMAIL ?? "nfctapusa@gmail.com";
  const autoSocial = !!process.env.AYRSHARE_API_KEY;
  const biz = bizList.find(x => x.id === b) ?? bizList[0];
  const gs = biz?.leadsnap_id ? await googleStats(biz.leadsnap_id) : null;

  if (!biz) return (
    <main className="narrow"><section className="hero"><h1>Welcome{user.name ? `, ${user.name}` : ""}</h1>
      <p className="muted">You don't have a business yet. Grade one to get started.</p><a href="/grader" className="btn dark">Grade my business</a></section></main>
  );

  const reports = await sql`SELECT id, score, data, created_at FROM reports WHERE business_id = ${biz.id} ORDER BY created_at DESC LIMIT 12`;
  const latest = reports[0];
  const prev = reports[1];
  const checks: any[] = latest?.data?.checks ?? [];
  const todo = checks.filter(c => c.status === "fail").sort((a, b) => b.weight - a.weight);
  const paid = biz.plan !== "free" && biz.status !== "canceled";
  const tasks = await sql`SELECT key, title, who, done FROM tasks WHERE business_id = ${biz.id} ORDER BY sort` as any[];
  const doneN = tasks.filter(t => t.done).length;
  const services = servicesFor(biz);
  const socialOn = biz.plan === "pro" || (biz.addons ?? []).includes("social");
  const weekPosts = socialOn ? await sql`SELECT id, kind, caption, photo, scheduled_for, status, error FROM posts WHERE business_id = ${biz.id} AND scheduled_for > now() - interval '7 days' ORDER BY scheduled_for` as any[] : [];
  const results = await sql`SELECT kind, title, detail, url, created_at FROM results WHERE business_id = ${biz.id} ORDER BY created_at DESC LIMIT 12` as any[];
  const planInfo = planById(biz.plan);
  const STATUS: Record<string, string> = { pending: "Payment pending", active: "Active", trial: "Free months", past_due: "Payment failed", canceled: "Canceled" };
  const delta = latest && prev ? latest.score - prev.score : null;

  return (
    <div className="dash">
      <aside className="side">
        <BizSwitcher list={bizList.map(x => ({ id: x.id, name: x.name }))} current={biz.id} />
        <nav>
          <a className="on" href={`/dashboard?b=${biz.id}`}>Overview</a>
          <a href={`/dashboard?b=${biz.id}#results`}>Results</a>
          {socialOn && <a href={`/dashboard?b=${biz.id}#posts`}>Posts</a>}
          <a href={`/dashboard?b=${biz.id}#services`}>Add services</a>
          <a href={`/dashboard?b=${biz.id}#brand`}>Brand kit</a>
          <a href="/mailers">Postcards</a>
        </nav>
        <form action="/api/auth/logout" method="post"><button className="link">Log out</button></form>
      </aside>

      <main className="dmain">
        <div className="dhead">
          <div><p className="eyebrow">{biz.address ?? biz.website ?? "Your business"}</p><h1>{biz.name}</h1></div>
          <span className={`badge ${paid ? "paid" : ""}`}>{planInfo && biz.plan !== "free" ? planInfo.name : "Free plan"}</span>
        </div>

        {upgraded && <p className="ok-note">Thanks! Your upgrade is being set up. We'll text you shortly.</p>}
        {billing === "none" && <p className="ok-note">Billing isn't set up online yet. Text us and we'll take care of it.</p>}
        {biz.status === "past_due" && <p className="err-note">Your last payment didn't go through. Update your card to keep your Google profile managed.</p>}

        {invited && <p className="ok-note">Thanks! We'll accept the invite and start on your profile within one business day.</p>}
        {tasks.some(t => t.key === "google" && !t.done) && biz.plan !== "free" && (
          <div className="card gbpcard" id="google">
            <b>Step 1: Add Lokly as a manager on your Google profile</b>
            <p className="muted small">This lets us update your profile, reply to reviews and post offers. You stay the owner and can remove us anytime. Takes 2 minutes.</p>
            <ol className="steps-sm">
              <li>On your phone or computer, search Google for <b>{biz.name}</b> while signed in to the Google account that owns your profile. Or open <a href="https://business.google.com/locations" target="_blank" rel="noreferrer">business.google.com</a>.</li>
              <li>Tap the <b>⋮ menu</b>, then <b>Business Profile settings</b>, then <b>People and access</b>.</li>
              <li>Tap <b>Add</b> and enter <code>{managerEmail}</code></li>
              <li>Choose <b>Manager</b> (not Owner) and tap <b>Invite</b>.</li>
            </ol>
            <form method="post" action="/api/gbp-invite"><input type="hidden" name="b" value={biz.id} /><button className="btn dark sm">I sent the invite</button></form>
            <p className="small muted">Don't have a Google profile yet, or can't find it? Text us and we'll set it up with you.</p>
          </div>
        )}
        {tasks.length > 0 && doneN < tasks.length && (
          <div className="card">
            <div className="gs-head"><b>Getting set up</b><span className="muted small">{doneN} of {tasks.length} done</span></div>
            <div className="prog"><i style={{ width: `${(doneN / tasks.length) * 100}%` }} /></div>
            <ul className="tasks">{tasks.map(t => <li key={t.key} className={t.done ? "done" : ""}><span className="tk" aria-hidden="true">{t.done ? "✓" : ""}</span>{t.title}<em>{t.who === "owner" ? "You" : "Lokly"}</em></li>)}</ul>
          </div>
        )}

        {gs ? (
          <div className="card gstats">
            <div className="gs-head"><b>Your Google stats</b><span className="muted small">Last 30 days vs the 30 before</span></div>
            <div className="gs-kpis">
              {([["Times you showed up", gs.appearances], ["Calls", gs.calls], ["Calls, clicks & directions", gs.actions]] as const).map(([label, k]) => (
                <div key={label}><strong>{k.current.toLocaleString()}</strong><span>{label}</span>
                  {k.change_pct != null && <em className={k.change_pct >= 0 ? "up" : "down"}>{k.change_pct >= 0 ? "+" : ""}{k.change_pct}%</em>}</div>
              ))}
              {gs.reviews && <div><strong>{gs.reviews.rating?.toFixed?.(1) ?? gs.reviews.rating}★</strong><span>{gs.reviews.count} reviews{gs.reviews.unreplied ? `, ${gs.reviews.unreplied} awaiting reply` : ", all replied"}</span></div>}
            </div>
            {gs.trend.length > 0 && (() => { const max = Math.max(...gs.trend.map(t => t.maps + t.search), 1); return (
              <div className="gs-chart" aria-label="Monthly appearances on Google Search and Maps">
                {gs.trend.map(t => <div key={t.period} title={`${t.period}: ${t.search} Search, ${t.maps} Maps`}>
                  <i style={{ height: `${(t.search / max) * 100}%` }} className="s" /><i style={{ height: `${(t.maps / max) * 100}%` }} className="m" />
                  <small>{new Date(t.period + "-02").toLocaleString("en-US", { month: "short" })}</small></div>)}
              </div>); })()}
            <p className="gs-legend small muted"><span className="s" /> Google Search <span className="m" /> Google Maps</p>
            {gs.tips.map(t => <p key={t.title} className="small"><b>{t.title}.</b> {t.body}</p>)}
            {biz.stats_url && <a className="btn dark sm" href={biz.stats_url} target="_blank" rel="noreferrer">Open full report</a>}
          </div>
        ) : (
        <div className="card stats">
          <div><b>Your Google stats</b><p className="muted small">Calls, direction requests, and how often you show up on Google, updated by your Lokly team.</p></div>
          {biz.stats_url ? <a className="btn dark sm" href={biz.stats_url} target="_blank" rel="noreferrer">Open my Google stats</a>
            : <p className="muted small">We're connecting your Google profile. Your stats will show up here within 1 business day of signup.</p>}
        </div>
        )}


        <div className="card" id="results">
          <div className="gs-head"><b>What we did for you</b><span className="muted small">Updated by your Lokly team</span></div>
          {results.length === 0 ? <p className="small muted">Your posts, review replies, postcards and campaigns will show up here as we do them.</p> : (
            <ul className="feed">{results.map((r, i) => (
              <li key={i}><span className="feed-k">{r.kind}</span><div><b>{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> : r.title}</b>{r.detail && <p className="muted small">{r.detail}</p>}</div><time className="muted small">{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></li>
            ))}</ul>
          )}
        </div>

        {socialOn && (
          <div className="card" id="posts">
            <div className="gs-head"><b>This week's posts</b>
              <form method="post" action="/api/posts" className="ap-toggle"><input type="hidden" name="b" value={biz.id} /><input type="hidden" name="action" value="autopilot" /><input type="hidden" name="on" value={biz.social?.autopilot ? "0" : "1"} />
                <button className={`chip ${biz.social?.autopilot ? "on" : ""}`}>{biz.social?.autopilot ? "Autopilot on" : "I approve first"}</button></form>
            </div>
            <p className="muted small">{biz.social?.autopilot ? "We write and publish 3 posts a week to your Instagram and Facebook. Tap the button to approve them first instead." : "Every Monday we write 3 posts for you. Approve, edit, or skip each one. Tap the button to let them publish automatically."}</p>
            {weekPosts.length === 0 ? <p className="small muted">Your first posts show up here on Monday.</p> : (
              <div className="pd-grid">{weekPosts.map(p => (
                <form key={p.id} className="pd" method="post" action="/api/posts">
                  <div className="pd-top"><b>{p.kind}</b><span className="muted small">{new Date(p.scheduled_for).toLocaleString("en-US", { weekday: "short", hour: "numeric", timeZone: "America/Los_Angeles" })}</span></div>
                  {p.photo && <img src={p.photo} alt="" loading="lazy" />}
                  <input type="hidden" name="b" value={biz.id} /><input type="hidden" name="post" value={p.id} />
                  {p.status === "pending" ? <>
                    <textarea name="caption" defaultValue={p.caption} rows={6} aria-label="Caption" />
                    <div className="pd-actions"><button className="btn dark sm" name="action" value="approve">Approve</button><button className="btn ghost sm" name="action" value="skip">Skip</button></div>
                  </> : <>
                    <pre>{p.caption}</pre>
                    <span className={`st ${p.status === "error" ? "soon" : "live"}`}>{p.status === "scheduled" ? "Scheduled" : p.status === "approved" ? "Approved, we'll post it" : p.status === "skipped" ? "Skipped" : p.status === "error" ? "Couldn't post, we're on it" : p.status}</span>
                  </>}
                </form>
              ))}</div>
            )}
          </div>
        )}

        {(biz.plan === "pro" || (biz.addons ?? []).includes("social")) && (
          <div className="card" id="social">
            <div className="gs-head"><b>Your social media</b><span className="muted small">Instagram, Facebook{autoSocial ? " and TikTok" : ""}</span></div>
            {social === "linked" && <p className="ok-note">Connected. We'll start posting this week.</p>}
            {social === "error" && <p className="err-note">That didn't connect. Try again or text us.</p>}
            {autoSocial ? (
              <form method="post" action="/api/social/connect"><input type="hidden" name="b" value={biz.id} />
                <p className="muted small">{biz.social?.profileKey ? "Add or reconnect an account anytime." : "One tap: log in to your accounts on the secure page and you're done. You stay the owner."}</p>
                <button className="btn dark sm">{biz.social?.profileKey ? "Manage connected accounts" : "Connect Instagram, Facebook & TikTok"}</button></form>
            ) : (
              <>
                <p className="muted small">Add Lokly as a partner so we can post for you. You stay the owner and can remove us anytime. About 5 minutes.</p>
                <ol className="steps-sm">
                  <li>On your phone, open <a href="https://business.facebook.com/latest/settings/partners" target="_blank" rel="noreferrer">business.facebook.com → Settings → Partners</a>.</li>
                  <li>Tap <b>Add</b>, then <b>Give a partner access to your assets</b>.</li>
                  <li>Paste Lokly's Business ID: <code>{process.env.META_BUSINESS_ID ?? "we'll text it to you"}</code></li>
                  <li>Turn on your <b>Facebook Page</b> and <b>Instagram account</b> with <b>Content</b> access, then save.</li>
                </ol>
                <p className="small muted">Instagram must be a Business account linked to your Facebook Page. Stuck? Text us and we'll do it with you.</p>
              </>
            )}
          </div>
        )}

        <div className="card" id="services">
          <p className="eyebrow">Add services</p>
          <p className="muted small">Tap to add. We do the work, and you'll see the results in "What we did for you."</p>
          {requested && <p className="ok-note">Got it. We'll text you within one business day to set that up.</p>}
          {biz.place_id && (
            <div className="rkit">
              <div>
                <b>Your Google review link</b>
                <p className="muted small">Text it to happy customers or print the QR code for your counter.</p>
                <input readOnly value={`https://search.google.com/local/writereview?placeid=${biz.place_id}`} aria-label="Google review link" onFocus={undefined} />
                <p className="small">Copy and send: <i>"Thanks for coming in! If you have a sec, a quick Google review helps us a ton: https://search.google.com/local/writereview?placeid={biz.place_id}"</i></p>
              </div>
              <img src={`https://quickchart.io/qr?size=220&margin=1&text=${encodeURIComponent(`https://search.google.com/local/writereview?placeid=${biz.place_id}`)}`} alt="QR code that opens your Google review page" width={140} height={140} />
            </div>
          )}
          <div className="toolgrid">
            {services.map(v => (
              <form key={v.id} className="tool" method="post" action="/api/upsell">
                <b>{v.name}</b>
                <p className="muted">{v.desc}</p>
                <input type="hidden" name="b" value={biz.id} /><input type="hidden" name="offer" value={v.id} />
                {v.state === "active" ? <span className="st live">Active, we're on it</span>
                  : v.state === "included" ? <span className="st live">Included in your plan</span>
                  : v.state === "soon" ? <span className="st soon">Coming soon</span>
                  : v.href ? <a className="btn ghost sm" href={v.href}>{v.price ? `Order, ${v.price}` : "Open"}</a>
                  : <button className="btn ghost sm">Add{v.price ? `, ${v.price}` : ""}</button>}
              </form>
            ))}
          </div>
        </div>
        {planInfo && biz.plan !== "free" && (
          <div className="card plancard-d">
            <div>
              <p className="eyebrow">Your plan</p>
              <b>{planInfo.name}</b> <span className={`st ${biz.status === "active" ? "live" : biz.status === "trial" ? "managed" : "soon"}`}>{STATUS[biz.status] ?? biz.status}</span>
              <p className="muted small">{biz.plan === "site" ? (biz.trial_ends_at ? `Free management until ${new Date(biz.trial_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}, then $25/mo for management, hosting and weekly changes.` : "3 months of free management start when your site goes live.") : `$${planInfo.price}/mo, month to month.`}</p>
            </div>
            <form method="post" action="/api/billing"><input type="hidden" name="b" value={biz.id} /><button className="btn ghost sm">Billing & invoices</button></form>
          </div>
        )}

        <div className="card" id="brand">
          <div className="gs-head"><b>Your brand kit</b><span className="muted small">Used for your postcards and social posts</span></div>
          <form method="post" action="/api/brandkit" className="bk-form">
            <input type="hidden" name="b" value={biz.id} />
            <input name="website" defaultValue={biz.website ?? ""} placeholder="yourbusiness.com" aria-label="Your website" inputMode="url" />
            <button className="btn dark sm">{biz.assets ? "Refresh from my site" : "Pull from my website"}</button>
          </form>
          {biz.assets ? (
            <div className="bk">
              <div className="bk-row">
                {biz.assets.logo && <img src={biz.assets.logo} alt="Your logo" className="bk-logo" />}
                <div>
                  <b>{biz.assets.title ?? biz.name}</b>
                  {biz.assets.tagline && <p className="muted small">{biz.assets.tagline}</p>}
                  <p className="small">{[biz.assets.color && `Color ${biz.assets.color}`, biz.assets.instagram && "Instagram found", biz.assets.facebook && "Facebook found", biz.assets.tiktok && "TikTok found"].filter(Boolean).join(" · ") || "No social links found on your site"}</p>
                </div>
                {biz.assets.color && <span className="bk-swatch" style={{ background: biz.assets.color }} aria-hidden="true" />}
              </div>
              {biz.assets.photos?.length > 0 ? <div className="bk-photos">{biz.assets.photos.slice(0, 8).map((p: string) => <img key={p} src={p} alt="" loading="lazy" />)}</div>
                : <p className="small muted">No photos found yet. Text us 5 or more and we'll add them.</p>}
            </div>
          ) : <p className="small muted">Add your website and we'll pull your logo, colors and photos. No website? Text us your logo and photos instead.</p>}
        </div>

        <div className="kpis">
          <div className="card kpi"><span>Visibility score</span><b>{latest ? latest.score : "—"}<small>/100</small></b>
            {delta !== null && <em className={delta >= 0 ? "good" : "bad"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} since last scan</em>}</div>
          <div className="card kpi"><span>Issues to fix</span><b>{latest ? todo.length : "—"}</b><em className="muted">from your latest scan</em></div>
          <div className="card kpi"><span>Last scanned</span><b className="sm">{latest ? new Date(latest.created_at).toLocaleDateString() : "Never"}</b><RescanButton businessId={biz.id} /></div>
        </div>

        {reports.length > 1 && (
          <div className="card">
            <p className="eyebrow">Score history</p>
            <div className="spark">{[...reports].reverse().map(r => <div key={r.id} title={`${r.score} · ${new Date(r.created_at).toLocaleDateString()}`} style={{ height: `${Math.max(r.score, 4)}%` }} />)}</div>
          </div>
        )}

        <div className="card">
          <p className="eyebrow">Your to-do list</p>
          {!latest && <p className="muted">No scan yet. Run one to build your list.</p>}
          {latest && todo.length === 0 && <p>Nothing to fix. Nice work.</p>}
          <ol className="todo">
            {todo.slice(0, 15).map(c => (
              <li key={c.id}><span className={`sev ${c.weight >= 2 ? "hi" : ""}`}>{c.weight >= 2 ? "High" : "Med"}</span>
                <div><b>{c.title}</b><p className="muted">{c.why}</p>{c.found && <code>Found: {c.found}</code>}</div></li>
            ))}
          </ol>
        </div>

      </main>
    </div>
  );
}
