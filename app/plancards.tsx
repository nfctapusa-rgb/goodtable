import { PLANS } from "@/lib/plans";

// Plan picker. Buttons lead to onboarding (/start), where the owner links
// their website and info before checkout.
export function PlanCards({ context, compact }: { context?: { businessName?: string; website?: string | null; placeId?: string | null }; compact?: boolean }) {
  const q = (plan: string) => {
    const p = new URLSearchParams({ plan });
    if (context?.businessName) p.set("name", context.businessName);
    if (context?.website) p.set("website", context.website);
    if (context?.placeId) p.set("place", context.placeId);
    return `/start?${p}`;
  };
  return (
    <>
      <div className={`plans ${compact ? "compact" : ""}`}>
        {PLANS.filter(p => !p.addon).map(p => (
          <div key={p.id} className={`plancard ${p.highlight ? "hl" : ""}`}>
            <h3 className="pname">{p.name}</h3>
            <div className="price"><b>${p.price}</b><span>{p.interval === "month" ? " a month" : " one-time"}</span></div>
            {p.id === "site" && <p className="pnote">3 months of management free, then $25/mo</p>}
            <p className="pblurb">{p.blurb}</p>
            <a className={`btn ${p.highlight ? "lime" : "dark"} wide`} href={q(p.id)}>{p.cta}</a>
          </div>
        ))}
      </div>
      <p className="tiny muted center agree">Month to month, cancel anytime. Rankings are set by Google and aren't guaranteed.</p>
    </>
  );
}
