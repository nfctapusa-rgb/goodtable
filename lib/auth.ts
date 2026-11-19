import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db, reportScore } from "./db";

const COOKIE = "kern_session";
const DAYS = 30;

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const a = Buffer.from(hash, "hex"), b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(userId: string) {
  const sql = await db();
  const token = randomBytes(32).toString("base64url");
  const exp = new Date(Date.now() + DAYS * 864e5);
  await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${exp.toISOString()})`;
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", expires: exp });
}

export async function destroySession() {
  const c = await cookies();
  const t = c.get(COOKIE)?.value;
  if (t) { const sql = await db(); await sql`DELETE FROM sessions WHERE token = ${t}`; }
  c.delete(COOKIE);
}

export interface User { id: string; email: string; name: string | null; is_admin: boolean }

export async function currentUser(): Promise<User | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const sql = await db();
  const rows = (await sql`SELECT u.id, u.email, u.name, u.is_admin FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${t} AND s.expires_at > now()`) as User[];
  return rows[0] ?? null;
}

// Tenant guard: returns the business only if the user is a member.
export async function businessFor(userId: string, businessId: string) {
  const sql = await db();
  const rows = await sql`SELECT b.*, m.role FROM businesses b JOIN memberships m ON m.business_id = b.id
    WHERE b.id = ${businessId} AND m.user_id = ${userId}`;
  return rows[0] ?? null;
}

// Creates a business (optionally from a grader report) and makes the user its owner.
export async function createBusinessFromReport(userId: string, report: any, fallbackName?: string) {
  const sql = await db();
  const name = String(report?.businessName || fallbackName || "My business").slice(0, 120);
  const [b] = await sql`INSERT INTO businesses (name, website, place_id, address, city, category)
    VALUES (${name}, ${report?.url ?? null}, ${report?.placeId ?? null}, ${report?.address ?? null}, ${report?.city ?? null}, ${report?.keyword ?? null})
    RETURNING id`;
  await sql`INSERT INTO memberships (user_id, business_id, role) VALUES (${userId}, ${b.id}, 'owner')`;
  if (report?.scores && report?.checks) {
    await sql`INSERT INTO reports (business_id, score, data) VALUES (${b.id}, ${reportScore(report)}, ${JSON.stringify(report)})`;
  }
  await sql`INSERT INTO audit_log (business_id, user_id, action) VALUES (${b.id}, ${userId}, 'business.created')`;
  return b.id as string;
}
