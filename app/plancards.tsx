"use client";
import { useState } from "react";
import { PLANS, priceLabel, type PlanId } from "@/lib/plans";

export function PlanCards({ context, compact }: { context?: Record<string, unknown>; compact?: boolean }) {
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function buy(plan: PlanId) {
    setBusy(plan); setErr(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, ...context }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      location.href = j.url;
    } catch (e) { setErr((e as Error).message); setBusy(null); }
  }
  return (
    <>
      <div className={`plans ${compact ? "compact" : ""}`}>
        {PLANS.map(p => (
          <div key={p.id} className={`plancard ${p.highlight ? "hl" : ""}`}>
            {p.highlight && <span className="popular">Most popular</span>}
            <p className="eyebrow">{p.name}</p>
            <div className="price"><b>${p.price % 1 ? p.price.toFixed(2) : p.price}</b><span>{p.interval === "month" ? "/month" : " one-time"}</span></div>
            <p className="pblurb">{p.blurb}</p>
            <button className={`btn ${p.highlight ? "lime" : "dark"} wide`} disabled={!!busy} onClick={() => buy(p.id)}>{busy === p.id ? "Opening checkout…" : p.cta}</button>
            <ul className="pfeat">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
          </div>
        ))}
      </div>
      {err && <p className="err center">{err}</p>}
      <p className="tiny muted center agree">By purchasing, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>. Rankings aren't guaranteed.</p>
    </>
  );
}
export { priceLabel };
