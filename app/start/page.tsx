"use client";
import { useEffect, useState } from "react";
import { PLANS, planById, type PlanId } from "@/lib/plans";
import { MARKETING_TOOLS, STATUS_LABEL } from "@/lib/tools";

const FIELDS: { k: string; label: string; ph: string; type?: string; req?: boolean; pro?: boolean; card?: boolean }[] = [
  { k: "businessName", label: "Business name", ph: "Your business name", req: true },
  { k: "contactName", label: "Your name", ph: "First and last", req: true },
  { k: "email", label: "Email", ph: "you@business.com", type: "email", req: true },
  { k: "phone", label: "Mobile number", ph: "(213) 555-0100", type: "tel", req: true },
  { k: "password", label: "Create a password for your dashboard", ph: "At least 8 characters", type: "password", req: true },
  { k: "website", label: "Your website (optional, we'll grab your logo and photos)", ph: "yourbusiness.com" },
  { k: "shipTo", label: "Where should we mail your free NFC review card?", ph: "Business mailing address", req: true, card: true },
];

export default function Start() {
  const [plan, setPlan] = useState<PlanId>("local");
  const [f, setF] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Get started | Lokly";
    const p = new URLSearchParams(location.search);
    const pl = p.get("plan"); if (pl && planById(pl)) setPlan(pl as PlanId);
    setF(x => ({ ...x, businessName: p.get("name") ?? "", website: p.get("website") ?? "", placeId: p.get("place") ?? "", ...(p.get("email") ? { email: p.get("email")! } : {}) }));
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, ...f, src: new URLSearchParams(location.search).get("src") ?? "web" }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      if (j.next) { location.href = j.next; return; }
      if (j.manual) { setDone(true); scrollTo(0, 0); return; }
      location.href = j.url;
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  const chosen = planById(plan)!;
  if (done) return (
    <main className="narrow start"><section className="hero">
      <h1 className="sh-h2">You're on the list, {f.contactName?.split(" ")[0] || "thanks"}.</h1>
      <p className="sh-lead">We got everything for {f.businessName}. We'll call or text you at {f.phone} within one business day to finish setup and payment for {chosen.name}.</p>
      <a className="btn dark" href="/">Back to Lokly</a>
    </section></main>
  );
  return (
    <main className="narrow start">
      <section className="hero">
        <h1 className="sh-h2">Tell us about your business.</h1>
        <p className="sh-lead">Takes about a minute. You'll approve everything before it goes live.</p>
        <p className="pplabel" id="pplabel">Your plan</p>
        <div className="pickplan" role="radiogroup" aria-labelledby="pplabel">
          {PLANS.filter(p => !p.addon).map(p => (
            <label key={p.id} className={plan === p.id ? "on" : ""}>
              <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} />
              <b>{p.name}</b><span>{p.id === "site" ? "$299 once, then $39/mo after 3 free months" : p.listPrice ? `$${p.price}/mo founding price (reg. $${p.listPrice})` : `$${p.price}/mo`}</span>
            </label>
          ))}
        </div>
        <form onSubmit={submit} className="form">
          {FIELDS.filter(x => !x.pro || plan !== "local").map(x => (
            <label key={x.k}>{x.label}{!x.req && <span className="opt"> (optional)</span>}
              {x.k === "notes" ? <textarea rows={3} placeholder={x.ph} value={f[x.k] ?? ""} onChange={set(x.k)} />
                : <input type={x.type ?? "text"} required={x.req} placeholder={x.ph} value={f[x.k] ?? ""} onChange={set(x.k)} minLength={x.k === "password" ? 8 : undefined} autoComplete={x.k === "password" ? "new-password" : x.k === "email" ? "email" : x.k === "phone" ? "tel" : x.k === "contactName" ? "name" : x.k === "businessName" ? "organization" : "off"} />}
            </label>
          ))}
          <label className="check"><input type="checkbox" required checked={ok} onChange={e => setOk(e.target.checked)} />
            <span>I own or am authorized to manage this business and its Google profile, and I agree to the <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</span></label>
          <button className="btn dark" disabled={busy}>{busy ? "Opening secure checkout…" : chosen.id === "site" ? "Continue: $299 today, 3 months free" : `Continue: ${chosen.name}, $${chosen.price}/mo`}</button>
          {err && <p className="err">{err}</p>}
        </form>
      </section>
    </main>
  );
}
