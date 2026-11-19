import { NextResponse } from "next/server";
import { planById, SITE_FREE_MONTHS, SITE_MONTHLY_CENTS } from "@/lib/plans";
import { saveLead } from "@/lib/leads";
import { db, dbReady } from "@/lib/db";
import { currentUser, hashPassword, verifyPassword, createSession } from "@/lib/auth";
import { seedTasks, stripe } from "@/lib/accounts";

const s = (v: unknown, n = 300) => (v == null ? null : String(v).trim().slice(0, n) || null);

// Signup: creates the account + business (status "pending"), then sends the owner to Stripe.
// The Stripe webhook flips the business to active/trial. Without Stripe, it stays pending
// and the owner still gets their dashboard; admin activates after collecting payment.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const plan = planById(String(body.plan ?? "local"));
  if (!plan || plan.addon) return NextResponse.json({ error: "Pick a plan." }, { status: 400 });
  const email = String(body.email ?? "").trim().toLowerCase();
  const setup = { shipTo: s(body.shipTo), googleProfile: s(body.googleProfile), orderLink: s(body.orderLink), instagram: s(body.instagram, 80), notes: s(body.notes, 1000), tools: body.tools ? String(body.tools).split(",").filter(Boolean).slice(0, 10) : [] };
  await saveLead({ kind: "onboarding", source: body.src ?? "web", businessName: body.businessName, website: body.website, placeId: body.placeId, contactName: body.contactName, email, phone: body.phone, plan: plan.id, data: { ...setup, nfcCard: "to ship" } });
  if (!dbReady()) return NextResponse.json({ ok: true, manual: true });

  const sql = await db();
  let user = await currentUser();
  if (!user) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    const pw = String(body.password ?? "");
    const [ex] = await sql`SELECT id, password_hash FROM users WHERE email = ${email}` as any[];
    if (ex) {
      if (!verifyPassword(pw, ex.password_hash)) return NextResponse.json({ error: "You already have a Lokly account with this email. Enter that password, or log in first." }, { status: 409 });
      user = { id: ex.id } as any;
    } else {
      if (pw.length < 8) return NextResponse.json({ error: "Choose a password with at least 8 characters." }, { status: 400 });
      const [u] = await sql`INSERT INTO users (email, name, password_hash) VALUES (${email}, ${s(body.contactName, 80)}, ${hashPassword(pw)}) RETURNING id` as any[];
      user = { id: u.id } as any;
    }
    await createSession(user!.id);
  }

  const [b] = await sql`INSERT INTO businesses (name, website, place_id, phone, plan, status, setup)
    VALUES (${s(body.businessName, 120) ?? "My business"}, ${s(body.website)}, ${s(body.placeId)}, ${s(body.phone, 40)}, ${plan.id}, 'pending', ${JSON.stringify(setup)})
    RETURNING id` as any[];
  await sql`INSERT INTO memberships (user_id, business_id, role) VALUES (${user!.id}, ${b.id}, 'owner')`;
  await seedTasks(b.id, plan.id, { hasPlace: !!body.placeId });
  if (setup.tools.length) await sql`UPDATE tasks SET done = true, done_at = now() WHERE business_id = ${b.id} AND key = 'tools'`;
  await sql`INSERT INTO audit_log (business_id, user_id, action, meta) VALUES (${b.id}, ${user!.id}, 'signup', ${JSON.stringify({ plan: plan.id })})`;

  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ ok: true, manual: true, next: `/welcome?b=${b.id}` });

  const origin = new URL(req.url).origin;
  const f = new URLSearchParams();
  const sub = plan.interval === "month" || plan.id === "site";
  f.set("mode", sub ? "subscription" : "payment");
  f.set("client_reference_id", b.id);
  f.set("success_url", `${origin}/welcome?b=${b.id}&paid=1`);
  f.set("cancel_url", `${origin}/start?plan=${plan.id}&canceled=1`);
  f.set("allow_promotion_codes", "true");
  f.set("metadata[business_id]", b.id); f.set("metadata[plan]", plan.id); f.set("metadata[kind]", "signup");
  if (sub) { f.set("subscription_data[metadata][business_id]", b.id); f.set("subscription_data[metadata][plan]", plan.id); }
  if (email) f.set("customer_email", email);
  let i = 0;
  const item = (name: string, cents: number, monthly: boolean) => {
    f.set(`line_items[${i}][quantity]`, "1");
    f.set(`line_items[${i}][price_data][currency]`, "usd");
    f.set(`line_items[${i}][price_data][unit_amount]`, String(cents));
    f.set(`line_items[${i}][price_data][product_data][name]`, name);
    if (monthly) f.set(`line_items[${i}][price_data][recurring][interval]`, "month");
    i++;
  };
  if (plan.id === "site") {
    item("Website build + Google profile optimization", plan.cents, false);
    item("Google management + hosting", SITE_MONTHLY_CENTS, true);
    f.set("subscription_data[trial_period_days]", String(SITE_FREE_MONTHS * 30));
  } else item(plan.name, plan.cents, true);
  try {
    const j = await stripe("checkout/sessions", f);
    return NextResponse.json({ url: j.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
