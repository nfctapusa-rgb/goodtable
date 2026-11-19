"use client";
import { useEffect, useState } from "react";
import { MAILERS } from "@/lib/plans";

const RADII = ["Half a mile", "1 mile", "2 miles", "Specific ZIP codes"];

export default function Mailers() {
  const [f, setF] = useState({ businessName: "", address: "", headline: "10% off your first visit", detail: "Bring this card in. Good through the end of the month.", qty: 500, area: "1 mile", zips: "", contactName: "", email: "", phone: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { document.title = "Postcard mailers | Lokly"; }, []);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: k === "qty" ? Number(e.target.value) : e.target.value });
  const tier = MAILERS.find(m => m.qty === f.qty)!;

  async function order(e: React.FormEvent) {
    e.preventDefault(); setState("busy"); setErr(null);
    const res = await fetch("/api/mailer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    if (res.ok) { setState("done"); scrollTo(0, 0); } else { setErr((await res.json()).error ?? "Couldn't send. Try again."); setState("idle"); }
  }

  if (state === "done") return (
    <main className="narrow start"><section className="hero">
      <h1 className="sh-h2">Got it. Your postcard is in the works.</h1>
      <p className="sh-lead">We'll text {f.phone || f.email} a final proof and the exact mailing area to approve. Nothing prints or gets charged until you say yes.</p>
      <a className="btn dark" href="/">Back to Lokly</a>
    </section></main>
  );

  return (
    <main className="mailers">
      <section className="pr-hero"><div className="wrap">
        <h1 className="sh-title">Postcards to the homes around your shop.</h1>
        <p className="sh-lead">Pick your offer and your area. We design it, print it, and mail it, with a QR code so you can see who scanned.</p>
      </div></section>

      <div className="wrap ml-grid">
        <form className="form ml-form" onSubmit={order}>
          <h2 className="ad-h">Your offer</h2>
          <label>Business name<input required value={f.businessName} onChange={set("businessName")} autoComplete="organization" /></label>
          <label>Shop address<input required placeholder="225 W 7th St, Los Angeles" value={f.address} onChange={set("address")} autoComplete="street-address" /></label>
          <label>Headline<input required maxLength={48} value={f.headline} onChange={set("headline")} /></label>
          <label>Details<textarea rows={2} maxLength={120} value={f.detail} onChange={set("detail")} /></label>

          <h2 className="ad-h">Where and how many</h2>
          <label>Area<select value={f.area} onChange={set("area")}>{RADII.map(r => <option key={r}>{r}</option>)}</select></label>
          {f.area === "Specific ZIP codes" && <label>ZIP codes<input required placeholder="90014, 90013" value={f.zips} onChange={set("zips")} /></label>}
          <div className="qty" role="radiogroup" aria-label="How many postcards">
            {MAILERS.map(m => (
              <label key={m.qty} className={f.qty === m.qty ? "on" : ""}>
                <input type="radio" name="qty" value={m.qty} checked={f.qty === m.qty} onChange={set("qty")} />
                <b>{m.qty.toLocaleString()} homes</b><span>${m.price} · {(m.price / m.qty * 100).toFixed(0)}¢ each</span>
              </label>
            ))}
          </div>

          <h2 className="ad-h">Your contact</h2>
          <div className="row">
            <label>Your name<input required value={f.contactName} onChange={set("contactName")} autoComplete="name" /></label>
            <label>Mobile<input required type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></label>
          </div>
          <label>Email<input required type="email" value={f.email} onChange={set("email")} autoComplete="email" /></label>
          <button className="btn dark" disabled={state === "busy"}>{state === "busy" ? "Sending…" : `Request my proof: ${tier.qty.toLocaleString()} postcards, $${tier.price}`}</button>
          {err && <p className="err">{err}</p>}
          <p className="tiny muted">You'll approve a proof and the mailing area before anything prints or you're charged. Includes design, printing, postage and a tracked QR code. Printed and mailed by our print partner.</p>
        </form>

        <div className="ml-preview" aria-label="Postcard preview">
          <p className="ml-cap">Front</p>
          <div className="card4x6 front6">
            <span className="pc-name">{f.businessName || "Your Business"}</span>
            <h3>{f.headline || "Your offer"}</h3>
            <p>{f.detail}</p>
            <div className="pc-foot"><span>{f.address || "Your address"}</span><span className="pc-qr" aria-hidden="true" /></div>
          </div>
          <p className="ml-cap">Back</p>
          <div className="card4x6 back6">
            <div><b>{f.businessName || "Your Business"}</b><p>{f.address || "Your address"}</p><p className="pc-scan">Scan to see the menu and directions</p></div>
            <div className="pc-addr"><span className="pc-stamp">Postage</span><p>Current Resident<br />123 Neighbor St<br />Los Angeles, CA</p></div>
          </div>
        </div>
      </div>
    </main>
  );
}
