// Lob: prints and mails postcards. LOB_API_KEY (use the test_ key first: nothing prints, you get a PDF proof).
import { db } from "./db";

export const lobReady = () => !!process.env.LOB_API_KEY;
const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

// 6x9 postcard. Lob needs 0.125in bleed: 9.25 x 6.25 in.
export function postcardHtml(m: { businessName: string; headline: string; detail: string; address: string; photo?: string | null; logo?: string | null; color?: string | null; qr: string }) {
  const base = `<html><head><style>@page{size:9.25in 6.25in;margin:0}body{margin:0;width:9.25in;height:6.25in;font-family:Helvetica,Arial,sans-serif}</style></head><body>`;
  const bg = m.photo ? `background:linear-gradient(rgba(10,18,30,.2),rgba(10,18,30,.8)),url('${esc(m.photo)}') center/cover` : `background:${esc(m.color || "#142133")}`;
  const front = `${base}<div style="${bg};width:100%;height:100%;color:#fff;position:relative;box-sizing:border-box;padding:.6in">
    ${m.logo ? `<img src="${esc(m.logo)}" style="position:absolute;top:.5in;right:.5in;height:.9in;background:#fff;border-radius:8px;padding:6px">` : ""}
    <div style="font-size:20px;font-weight:700;opacity:.9">${esc(m.businessName)}</div>
    <div style="position:absolute;bottom:.6in;left:.6in;right:.6in"><div style="font-size:54px;font-weight:900;line-height:1">${esc(m.headline)}</div>
    <div style="font-size:20px;margin-top:12px">${esc(m.detail)}</div></div></div></body></html>`;
  const back = `${base}<div style="width:100%;height:100%;box-sizing:border-box;padding:.5in;display:flex">
    <div style="width:4.2in"><div style="font-size:26px;font-weight:900;color:#142133">${esc(m.businessName)}</div>
    <div style="font-size:15px;margin-top:6px;color:#333">${esc(m.address)}</div>
    <div style="font-size:22px;font-weight:700;margin-top:24px;color:#142133">${esc(m.headline)}</div>
    <img src="https://quickchart.io/qr?size=300&margin=1&text=${encodeURIComponent(m.qr)}" style="width:1.6in;margin-top:22px">
    <div style="font-size:13px;color:#555">Scan for directions and today's offer</div></div></div></body></html>`;
  return { front, back };
}

async function lob(path: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.lob.com/v1/${path}`, {
    method: "POST", headers: { Authorization: "Basic " + Buffer.from(`${process.env.LOB_API_KEY}:`).toString("base64"), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message ?? `Lob ${r.status}`);
  return j;
}

// Sends one postcard to the business itself. With a test key this is a free proof (PDF in j.url).
export async function sendProof(leadId: number) {
  const sql = await db();
  const [l] = await sql`SELECT * FROM leads WHERE id = ${leadId} AND kind = 'mailer'` as any[];
  if (!l) throw new Error("Postcard request not found");
  const d = l.data ?? {};
  const addr = String(d.address ?? "");
  const m = addr.match(/^(.*?),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})?/i);
  const to = { name: l.business_name, address_line1: m?.[1] ?? addr, address_city: m?.[2] ?? "Los Angeles", address_state: m?.[3] ?? "CA", address_zip: m?.[4] ?? "90014" };
  const html = postcardHtml({ businessName: l.business_name, headline: d.headline, detail: d.detail, address: addr, photo: d.photo?.startsWith("http") ? d.photo : null, logo: d.logo, color: d.color, qr: `https://lokly.pro/r/${leadId}` });
  const j = await lob("postcards", { description: `Lokly proof #${leadId}`, to, from: to, size: "6x9", front: html.front, back: html.back, use_type: "marketing" });
  await sql`UPDATE leads SET data = data || ${JSON.stringify({ status: "proof ready", proofUrl: j.url, lobId: j.id })}::jsonb WHERE id = ${leadId}`;
  return j;
}
