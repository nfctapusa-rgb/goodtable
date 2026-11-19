import { db, dbReady, reportScore } from "./db";

// Best-effort lead capture: never blocks or breaks the user-facing request.
export async function saveLead(l: { kind: "report" | "onboarding" | "mailer"; source?: string | null; businessName?: string | null; website?: string | null; placeId?: string | null; city?: string | null; score?: number | null; contactName?: string | null; email?: string | null; phone?: string | null; plan?: string | null; data?: unknown }) {
  if (!dbReady()) return;
  try {
    const sql = await db();
    const s = (v: unknown, n = 300) => (v == null || v === "" ? null : String(v).slice(0, n));
    await sql`INSERT INTO leads (kind, source, business_name, website, place_id, city, score, contact_name, email, phone, plan, data)
      VALUES (${l.kind}, ${s(l.source, 40)}, ${s(l.businessName)}, ${s(l.website)}, ${s(l.placeId)}, ${s(l.city)}, ${l.score ?? null}, ${s(l.contactName)}, ${s(l.email)}, ${s(l.phone, 40)}, ${s(l.plan, 20)}, ${l.data ? JSON.stringify(l.data) : null})`;
  } catch (e) { console.error("saveLead failed", e); }
}
export { reportScore };
