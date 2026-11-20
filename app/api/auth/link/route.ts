import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { magicUrl } from "@/lib/magic";
import { sendEmail } from "@/lib/email";
import { signInHtml } from "@/lib/magic";

// "Email me a sign-in link". Always answers the same way so it can't be used to check who has an account.
export async function POST(req: Request) {
  const f = await req.formData();
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  if (dbReady() && /@/.test(email)) {
    const [u] = await (await db())`SELECT id, name FROM users WHERE email = ${email}` as any[];
    if (u) await sendEmail(email, "Your Lokly sign-in link", signInHtml(u.name, magicUrl(u.id, 1))).catch(() => null);
  }
  return NextResponse.redirect(new URL("/login?sent=1", req.url), 303);
}

