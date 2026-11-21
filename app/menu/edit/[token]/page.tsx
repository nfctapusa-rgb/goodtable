import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Editor } from "./editor";
export const dynamic = "force-dynamic";
export const metadata = { title: "Edit your menu | Lokly", robots: { index: false } };
export default async function Edit({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { token } = await params; const { new: isNew } = await searchParams;
  const sql = await db();
  const [m] = await sql`SELECT slug, name, email, kind, theme, phone, address, city, website, logo, banner, color, data, published, views FROM menus WHERE edit_token = ${token}` as any[];
  if (!m) notFound();
  const sid = (await sql`SELECT id FROM menus WHERE edit_token = ${token}` as any[])[0].id;
  const [tot] = await sql`SELECT count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS w, count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS m,
    count(*) FILTER (WHERE src IN ('qr','nfc') AND created_at > now() - interval '30 days')::int AS tap FROM menu_scans WHERE menu_id = ${sid}` as any[];
  const byTable = await sql`SELECT table_no AS t, count(*)::int AS n FROM menu_scans WHERE menu_id = ${sid} AND table_no IS NOT NULL AND created_at > now() - interval '30 days' GROUP BY 1 ORDER BY 2 DESC LIMIT 30` as any[];
  return <Editor token={token} initial={m} isNew={!!isNew} stats={{ week: tot?.w ?? 0, month: tot?.m ?? 0, tap: tot?.tap ?? 0, byTable }} />;
}
