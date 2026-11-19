"use client";
import { useState } from "react";

export function RescanButton({ businessId }: { businessId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button className="btn lime sm" disabled={busy} onClick={async () => {
        setBusy(true); setErr(null);
        const r = await fetch("/api/rescan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId }) });
        if (r.ok) location.reload(); else { setErr((await r.json()).error); setBusy(false); }
      }}>{busy ? "Scanning…" : "Scan again"}</button>
      {err && <em className="bad">{err}</em>}
    </>
  );
}

export function BizSwitcher({ list, current }: { list: { id: string; name: string }[]; current: string }) {
  return (
    <div className="switcher">
      <a href="/" className="logo"><span className="mark" />GoodTable</a>
      <select value={current} onChange={e => e.target.value === "new" ? (location.href = "/grader") : (location.href = `/dashboard?b=${e.target.value}`)}>
        {list.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        <option value="new">+ Add a business</option>
      </select>
    </div>
  );
}
