import { db, dbReady } from "@/lib/db";

// Postcard QR codes land here: count the scan, then send to the business's Google Maps page or site.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbReady() || !/^\d+$/.test(id)) return Response.redirect("https://lokly.pro", 302);
  const sql = await db();
  const [l] = await sql`UPDATE leads SET data = jsonb_set(data, '{scans}', to_jsonb(COALESCE((data->>'scans')::int, 0) + 1)) WHERE id = ${Number(id)} AND kind = 'mailer' RETURNING business_name, website, place_id, data` as any[];
  const dest = l?.place_id ? `https://www.google.com/maps/place/?q=place_id:${l.place_id}` : l?.website || `https://www.google.com/maps/search/${encodeURIComponent(`${l?.business_name ?? ""} ${l?.data?.address ?? ""}`)}`;
  return Response.redirect(dest, 302);
}
