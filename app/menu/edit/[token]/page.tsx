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
  return <Editor token={token} initial={m} isNew={!!isNew} />;
}
