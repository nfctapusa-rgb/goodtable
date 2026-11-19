import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { hashPassword, createSession, createBusinessFromReport } from "@/lib/auth";

export async function POST(req: Request) {
  if (!dbReady()) return NextResponse.json({ error: "Accounts aren't connected yet. Add a Postgres database in Vercel." }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  const name = String(b.name ?? "").trim().slice(0, 80) || null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  const sql = await db();
  const exists = await sql`SELECT 1 FROM users WHERE email = ${email}`;
  if (exists.length) return NextResponse.json({ error: "An account with that email already exists. Log in instead." }, { status: 409 });
  const [u] = await sql`INSERT INTO users (email, name, password_hash) VALUES (${email}, ${name}, ${hashPassword(password)}) RETURNING id`;
  await createBusinessFromReport(u.id, b.report, b.businessName);
  await createSession(u.id);
  return NextResponse.json({ ok: true });
}
