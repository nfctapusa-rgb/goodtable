import { db, dbReady } from "@/lib/db";

// NFC review cards and review QR codes point here: lokly.pro/t/<code>.
// We count the tap, then open Google's "write a review" screen for that business.
// Everyone goes to Google; we never filter who is asked (Google bans review gating).
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!dbReady() || !/^[a-z0-9-]{2,40}$/i.test(code)) return Response.redirect("https://lokly.pro", 302);
  const sql = await db();
  const [b] = await sql`SELECT id, name, place_id, address FROM businesses WHERE tap_code = ${code.toLowerCase()}` as any[];
  if (!b) return Response.redirect("https://lokly.pro", 302);
  await sql`INSERT INTO taps (business_id, kind, ua) VALUES (${b.id}, 'review', ${(req.headers.get("user-agent") ?? "").slice(0, 200)})`.catch(() => null);
  const dest = b.place_id ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(b.place_id)}`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${b.name} ${b.address ?? ""}`)}`;
  return Response.redirect(dest, 302);
}
