import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { magicUrl, signInHtml } from "@/lib/magic";
import { sendEmail } from "@/lib/email";
import { seedTasks } from "@/lib/accounts";

// Admin: give an existing client (already managed in LeadSnap) a Lokly login and send them a sign-in link.
export async function POST(req: Request) {
  const f = await req.formData();
  const key = String(f.get("key") ?? "");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const back = new URL(`/admin?key=${encodeURIComponent(key)}#clients`, req.url);
  const s = (k: string, n = 160) => String(f.get(k) ?? "").trim().slice(0, n) || null;
  const email = s("email")?.toLowerCase();
  const name = s("business", 120);
  if (!email || !/@/.test(email) || !name) { back.searchParams.set("msg", "Business name and owner email are required."); return NextResponse.redirect(back, 303); }
  const sql = await db();
  let [u] = await sql`SELECT id, name FROM users WHERE email = ${email}` as any[];
  if (!u) [u] = await sql`INSERT INTO users (email, name, password_hash) VALUES (${email}, ${s("owner", 80)}, ${hashPassword(randomBytes(24).toString("hex"))}) RETURNING id, name` as any[];
  const plan = ["local", "site", "pro"].includes(String(f.get("plan"))) ? String(f.get("plan")) : "local";
  const ls = s("leadsnap", 20);
  const [b] = await sql`INSERT INTO businesses (name, website, place_id, plan, status, leadsnap_id, phone)
    VALUES (${name}, ${s("website", 200)}, ${s("place", 200)}, ${plan}, 'active', ${ls && /^\d+$/.test(ls) ? ls : null}, ${s("phone", 40)}) RETURNING id` as any[];
  await sql`INSERT INTO memberships (user_id, business_id, role) VALUES (${u.id}, ${b.id}, 'owner') ON CONFLICT DO NOTHING`;
  await seedTasks(b.id, plan);
  await sql`UPDATE tasks SET done = true, done_at = now() WHERE business_id = ${b.id} AND key IN ('google', 'google_accept', 'optimize', 'nfc', 'posts', 'assets')`;
  if (f.get("send") === "1") await sendEmail(email, `Your ${name} results are live on Lokly`, signInHtml(u.name, magicUrl(u.id, 14), `Your Google numbers for <b>${name}</b> are now in one place: views, calls, direction requests and reviews, updated automatically. Tap below to open them.`)).catch(() => null);
  back.searchParams.set("msg", `${name} added${f.get("send") === "1" ? " and the sign-in link was emailed" : ""}. Their link: ${magicUrl(u.id, 14)}`);
  return NextResponse.redirect(back, 303);
}
