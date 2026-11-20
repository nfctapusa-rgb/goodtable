"use client";
import { useState } from "react";
import { THEMES, defaultTheme } from "@/lib/menus";
type Item = { name: string; desc?: string; price?: string; photo?: string; tags?: string[] };
type Sec = { name: string; items: Item[] };

// Resize an uploaded image in the browser and return a compact JPEG data URL.
async function shrink(file: File, max: number, q = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
  const r = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  return c.toDataURL(file.type === "image/png" && max <= 400 ? "image/png" : "image/jpeg", q);
}

export function Editor({ token, initial, isNew }: { token: string; initial: any; isNew: boolean }) {
  const [m, setM] = useState({ ...initial, data: { sections: [], specials: [], hours: "", about: "", order: "", instagram: "", ...initial.data } });
  const [state, setState] = useState<"" | "saving" | "saved" | string>(isNew ? "new" : "");
  const set = (k: string, v: any) => { setM((x: any) => ({ ...x, [k]: v })); setState(""); };
  const setD = (k: string, v: any) => { setM((x: any) => ({ ...x, data: { ...x.data, [k]: v } })); setState(""); };
  const secs: Sec[] = m.data.sections;
  const upd = (fn: (s: Sec[]) => void) => { const c = structuredClone(secs); fn(c); setD("sections", c); };
  const link = `https://lokly.pro/m/${m.slug}`;
  async function save() {
    setState("saving");
    const r = await fetch(`/api/menu/${token}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) });
    setState(r.ok ? "saved" : (await r.json().catch(() => ({}))).error || "Couldn't save. Try again.");
  }
  const pic = (k: string, max: number) => async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) set(k, await shrink(f, max)); };

  return (
    <main className="me">
      {state === "new" && <div className="me-new"><b>Your menu is live! 🎉</b> We emailed you this private edit link. Bookmark it: anyone with it can edit your menu.</div>}
      <div className="me-top">
        <div><h1>{m.name}</h1><a href={link} target="_blank" rel="noreferrer">{link.replace("https://", "")}</a> <small className="muted">· {m.views} views</small></div>
        <button className="btn dark" onClick={save} disabled={state === "saving"}>{state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : "Save"}</button>
      </div>
      {state && !["saving", "saved", "new"].includes(state) && <p className="err">{state}</p>}

      <section className="me-card"><h2>Look</h2>
        <div className="me-brand">
          <label className="me-up">{m.logo ? <img src={m.logo} alt="" /> : <span>+ Logo</span>}<input type="file" accept="image/*" onChange={pic("logo", 300)} hidden /></label>
          <label className="me-up wide" style={m.banner ? { backgroundImage: `url("${m.banner}")` } : undefined}>{!m.banner && <span>+ Banner photo</span>}<input type="file" accept="image/*" onChange={pic("banner", 1400)} hidden /></label>
        </div>
        <label>Brand color <input type="color" value={m.color || "#E30A23"} onChange={e => set("color", e.target.value)} /></label>
        <p className="ax-label" style={{ margin: 0 }}>Style</p>
        <div className="me-themes">{(Object.keys(THEMES) as (keyof typeof THEMES)[]).map(t => (
          <button key={t} type="button" className={`me-theme t-${t} ${(m.theme || defaultTheme(m.kind)) === t ? "on" : ""}`} style={{ ["--mc" as any]: m.color || "#E30A23" }} onClick={() => set("theme", t)}>
            <i /><b>{THEMES[t].name}</b><small>{THEMES[t].note}</small></button>))}</div>
      </section>

      <section className="me-card me-grow">
        <h2>Grow {m.name}</h2>
        <a className="me-offer" href={`/api/buy?item=nfc_menu&qty=10&ref=menu-${m.slug}`}>
          <span className="me-ico">📲</span><div><b>NFC tap menu cards</b><small>Guests tap their phone on the table and this menu opens. Works with your QR code too.</small></div><em>Order</em></a>
        <a className="me-offer" href={`/start?plan=local&name=${encodeURIComponent(m.name)}&src=menu&email=${encodeURIComponent(m.email ?? "")}`}>
          <span className="me-ico">📍</span><div><b>Get found on Google: $25/mo</b><small>We run your Google profile every week, link this menu to it, and get you more reviews. Free review card included.</small></div><em>Start</em></a>
        <a className="me-offer" href={`/grader?q=${encodeURIComponent(`${m.name} ${m.city ?? ""}`.trim())}&src=menu`}>
          <span className="me-ico">📊</span><div><b>Free Google report</b><small>See how {m.name} shows up on Google Maps and what to fix. 1 minute.</small></div><em>Check</em></a>
      </section>

      <section className="me-card"><h2>Details</h2>
        <label>Name<input value={m.name} onChange={e => set("name", e.target.value)} /></label>
        <label>Phone<input value={m.phone ?? ""} onChange={e => set("phone", e.target.value)} type="tel" /></label>
        <label>Address<input value={m.address ?? ""} onChange={e => set("address", e.target.value)} placeholder="123 Main St, Los Angeles, CA" /></label>
        <label>Online ordering link<input value={m.data.order ?? ""} onChange={e => setD("order", e.target.value)} placeholder="https://…" /></label>
        <label>Website<input value={m.website ?? ""} onChange={e => set("website", e.target.value)} placeholder="https://…" /></label>
        <label>Hours<textarea rows={3} value={m.data.hours ?? ""} onChange={e => setD("hours", e.target.value)} placeholder={"Mon–Fri 11am–9pm\nSat–Sun 10am–10pm"} /></label>
        <label>About<textarea rows={3} value={m.data.about ?? ""} onChange={e => setD("about", e.target.value)} placeholder="Family-owned since…" /></label>
      </section>

      <section className="me-card"><h2>Specials & events</h2><p className="muted small">Shown at the top of your menu. Happy hour, live music, today's special.</p>
        {m.data.specials.map((x: any, i: number) => (
          <div key={i} className="me-item">
            <input value={x.title} placeholder="Taco Tuesday: $2 tacos" onChange={e => { const c = [...m.data.specials]; c[i] = { ...x, title: e.target.value }; setD("specials", c); }} />
            <input value={x.when ?? ""} placeholder="Every Tuesday 5–9pm" onChange={e => { const c = [...m.data.specials]; c[i] = { ...x, when: e.target.value }; setD("specials", c); }} />
            <input value={x.desc ?? ""} placeholder="Details (optional)" onChange={e => { const c = [...m.data.specials]; c[i] = { ...x, desc: e.target.value }; setD("specials", c); }} />
            <button className="me-x" onClick={() => setD("specials", m.data.specials.filter((_: any, j: number) => j !== i))}>Remove</button>
          </div>))}
        <button className="btn ghost sm" onClick={() => setD("specials", [...m.data.specials, { title: "", when: "", desc: "" }])}>+ Add a special or event</button>
      </section>

      <section className="me-card"><h2>Menu</h2>
        {secs.map((s, i) => (
          <div key={i} className="me-sec">
            <div className="me-sechead"><input className="me-secname" value={s.name} placeholder="Section (e.g. Tacos)" onChange={e => upd(c => { c[i].name = e.target.value; })} />
              <button className="me-x" onClick={() => upd(c => { if (i > 0) [c[i - 1], c[i]] = [c[i], c[i - 1]]; })}>↑</button>
              <button className="me-x" onClick={() => confirm(`Delete section "${s.name}"?`) && upd(c => { c.splice(i, 1); })}>Delete</button></div>
            {s.items.map((it, j) => (
              <div key={j} className="me-item">
                <div className="me-row"><input value={it.name} placeholder="Item name" onChange={e => upd(c => { c[i].items[j].name = e.target.value; })} />
                  <input className="me-price" value={it.price ?? ""} placeholder="12.99" inputMode="decimal" onChange={e => upd(c => { c[i].items[j].price = e.target.value; })} /></div>
                <input value={it.desc ?? ""} placeholder="Description (optional)" onChange={e => upd(c => { c[i].items[j].desc = e.target.value; })} />
                <div className="me-row">
                  <label className="me-up sm">{it.photo ? <img src={it.photo} alt="" /> : <span>+ Photo</span>}<input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) { const d = await shrink(f, 500, 0.75); upd(c => { c[i].items[j].photo = d; }); } }} /></label>
                  <input value={(it.tags ?? []).join(", ")} placeholder="Tags: spicy, vegan" onChange={e => upd(c => { c[i].items[j].tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean); })} />
                  <button className="me-x" onClick={() => upd(c => { c[i].items.splice(j, 1); })}>Remove</button>
                </div>
              </div>))}
            <button className="btn ghost sm" onClick={() => upd(c => { c[i].items.push({ name: "", price: "", desc: "" }); })}>+ Add item</button>
          </div>))}
        <button className="btn dark sm" onClick={() => upd(c => { c.push({ name: "", items: [{ name: "", price: "", desc: "" }] }); })}>+ Add section</button>
      </section>

      <section className="me-card"><h2>Share it</h2>
        <p>Your link: <a href={link} target="_blank" rel="noreferrer">{link}</a></p>
        <img className="me-qr" src={`/api/menu/qr/${m.slug}`} alt="QR code for your menu" />
        <p><a className="btn ghost sm" href={`/api/menu/qr/${m.slug}`} download={`${m.slug}-menu-qr.svg`}>Download QR code</a></p>
        <p className="muted small">Want guests to tap their phone instead of scanning? Ask us about Lokly NFC menu cards for every table. Want more customers from Google too? <a href="/grader">Get your free Google report</a>.</p>
        <label className="me-pub"><input type="checkbox" checked={m.published !== false} onChange={e => set("published", e.target.checked)} /> Menu is public</label>
      </section>
      <div className="me-sticky"><button className="btn dark" onClick={save} disabled={state === "saving"}>{state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : "Save changes"}</button></div>
    </main>
  );
}
