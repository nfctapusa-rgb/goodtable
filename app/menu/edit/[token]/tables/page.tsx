import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PrintButton } from "./print";
export const dynamic = "force-dynamic";
export const metadata = { title: "Table QR codes | Lokly", robots: { index: false } };

// Printable sheet: one QR per table, each labeled. Cut them out or put them in table stands.
export default async function Tables({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = await db();
  const [m] = await sql`SELECT slug, name, data FROM menus WHERE edit_token = ${token}` as any[];
  if (!m) notFound();
  const n = Math.max(1, Math.min(200, Number(m.data?.tables) || 10));
  return (
    <main className="tq">
      <div className="tq-bar"><b>{m.name}: {n} table QR codes</b><PrintButton /></div>
      <div className="tq-grid">{Array.from({ length: n }, (_, i) => i + 1).map(t => (
        <figure key={t}><img src={`/api/menu/qr/${m.slug}?t=${t}`} alt={`Table ${t} QR`} /><figcaption><b>Table {t}</b><span>Scan for our menu</span></figcaption></figure>))}</div>
    </main>
  );
}
