import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { verifyPassword, createSession, createBusinessFromReport } from "@/lib/auth";

export async function POST(req: Request) {
  if (!dbReady()) return NextResponse.json({ error: "Accounts aren't connected yet." }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase();
  const sql = await db();
  const [u] = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`;
  if (!u || !verifyPassword(String(b.password ?? ""), u.password_hash)) return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  if (b.report?.checks) await createBusinessFromReport(u.id, b.report);
  await createSession(u.id);
  return NextResponse.json({ ok: true });
}
