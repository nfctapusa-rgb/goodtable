import { cookies } from "next/headers";
import { db, dbReady } from "./db";

// First-touch attribution, stored in the `lokly_attr` cookie by /ig and by <Attribution/>.
// Holds only marketing tags (source/medium/campaign, optional Instagram handle) and a random visitor id.
export const ATTR_COOKIE = "lokly_attr";
export interface Attr { s?: string; m?: string; c?: string; h?: string; v?: string; t?: number }

const clean = (v: unknown, n = 60) => (v == null || v === "" ? undefined : String(v).replace(/[^\w.@\-:+ ]/g, "").slice(0, n) || undefined);

export function parseAttr(raw?: string | null): Attr {
  if (!raw) return {};
  try {
    let txt = raw; try { if (!raw.trim().startsWith("{")) txt = decodeURIComponent(raw); } catch {}
    const j = JSON.parse(txt);
    return { s: clean(j.s), m: clean(j.m), c: clean(j.c), h: clean(j.h, 40), v: clean(j.v, 40), t: Number(j.t) || undefined };
  } catch { return {}; }
}

export async function readAttr(): Promise<Attr> {
  try { return parseAttr((await cookies()).get(ATTR_COOKIE)?.value); } catch { return {}; }
}

// Best-effort: tracking never breaks the user-facing request.
export async function track(event: string, o: { attr?: Attr; userId?: string | null; businessId?: string | null; meta?: unknown; source?: string } = {}) {
  if (!dbReady()) return;
  try {
    const a = o.attr ?? (await readAttr());
    const sql = await db();
    await sql`INSERT INTO funnel_events (event, source, medium, campaign, visitor_id, user_id, business_id, meta)
      VALUES (${event}, ${clean(o.source) ?? a.s ?? "direct"}, ${a.m ?? null}, ${a.c ?? null}, ${a.v ?? null}, ${o.userId ?? null}, ${o.businessId ?? null}, ${o.meta ? JSON.stringify(o.meta) : null})`;
  } catch (e) { console.error("track failed", e); }
}

// The source a user signed up with, for attributing later events (paid, canceled) to the right channel.
export async function userSource(userId: string): Promise<Attr> {
  const sql = await db();
  const [u] = (await sql`SELECT attribution FROM users WHERE id = ${userId}`) as any[];
  return (u?.attribution as Attr) ?? {};
}
