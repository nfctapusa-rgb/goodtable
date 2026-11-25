import { db, dbReady } from "@/lib/db";
import { ptoken } from "@/lib/outreach";
import { searchPlaces, placesKey } from "@/lib/places";

// Outreach email link: record the click, stop the sequence, open their free report.
export async function GET(req: Request, { params }: { params: Promise<{ t: string }> }) {
  const { t } = await params;
  const [id, tok] = t.split(".");
  const base = new URL(req.url).origin;
  if (!dbReady() || !/^\d+$/.test(id) || ptoken(id) !== tok) return Response.redirect(`${base}/grader?src=outreach`, 302);
  const sql = await db();
  const [p] = await sql`UPDATE prospects SET clicked_at = COALESCE(clicked_at, now()), status = CASE WHEN status IN ('emailed', 'queued', 'finished') THEN 'clicked' ELSE status END, next_send_at = NULL
    WHERE id = ${Number(id)} RETURNING business_name, city, place_id` as any[];
  const q = p ? `${p.business_name}${p.city ? ` ${p.city}` : ""}` : "";
  const tail = `&src=outreach&pid=${encodeURIComponent(t)}&utm_source=outreach&utm_medium=email`;
  // Find their Google listing so the report opens already run, no searching needed.
  let place: string | null = p?.place_id ?? null;
  if (!place && q && placesKey()) { try { place = (await searchPlaces(q, 1, undefined, true))[0]?.id ?? null; } catch {} }
  return Response.redirect(place ? `${base}/grader?place=${encodeURIComponent(place)}${tail}` : `${base}/grader?q=${encodeURIComponent(q)}${tail}`, 302);
}
