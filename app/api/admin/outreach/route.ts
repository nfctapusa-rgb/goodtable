import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importCsv, startSequence, suppress, runOutreach, getTemplates, saveTemplate, renderEmail, aiDraft, STEPS } from "@/lib/outreach";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const f = await req.formData();
  const key = String(f.get("key") ?? "");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return new NextResponse("Not found", { status: 404 });
  const back = new URL(`/admin/outreach?key=${encodeURIComponent(key)}`, req.url);
  const sql = await db();
  const a = String(f.get("action") ?? "");
  try {
    if (a === "import") {
      const file = f.get("file");
      const text = (file && typeof file !== "string" && file.size ? await file.text() : "") || String(f.get("csv") ?? "");
      const r = await importCsv(text.slice(0, 5_000_000), String(f.get("source") || "import"));
      back.searchParams.set("msg", `Imported ${r.added} new leads. ${r.skipped} already on file, ${r.invalid} missing a name or valid email.`);
    } else if (a === "template" || a === "reset" || a === "ai") {
      const step = Math.min(Math.max(Number(f.get("step") ?? 0), 0), STEPS.length - 1);
      if (a === "reset") await saveTemplate(step, null);
      else if (a === "ai") await saveTemplate(step, await aiDraft(String(f.get("brief") ?? ""), step, req.headers.get("x-vercel-oidc-token")));
      else await saveTemplate(step, { subject: String(f.get("subject") ?? ""), html: String(f.get("html") ?? "") });
      back.searchParams.set("msg", a === "reset" ? `Email ${step + 1} is back to the built-in version.` : a === "ai" ? `AI wrote email ${step + 1}. Check the preview and send yourself a test.` : `Email ${step + 1} saved. Send yourself a test before it goes out.`);
      back.searchParams.set("t", String(step));
    } else if (a === "test") {
      const step = Math.min(Math.max(Number(f.get("step") ?? 0), 0), STEPS.length - 1);
      const to = String(f.get("to") ?? "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new Error("Enter the email to send the test to.");
      const pid = Number(f.get("pid") ?? 0);
      const [p] = pid ? await sql`SELECT * FROM prospects WHERE id = ${pid}` as any[] : [null];
      const sample = p ?? { id: 0, business_name: "Main St. Cuts", contact_name: "Alex Rivera", city: "Downtown LA", category: "barbershop", website: "mainstcuts.com" };
      const m = renderEmail(sample, step, await getTemplates());
      await sendEmail(to, `[TEST] ${m.subject}`, m.html, {});
      back.searchParams.set("msg", `Test of email ${step + 1}${p ? ` (as ${p.business_name})` : ""} sent to ${to}. Check your inbox and spam folder.`);
      back.searchParams.set("t", String(step));
    } else if (a === "start") {
      const r = await startSequence("all-new");
      back.searchParams.set("msg", `${r.length} leads queued. Up to ${process.env.OUTREACH_DAILY_CAP ?? 40} emails go out each weekday morning.`);
    } else if (a === "send") {
      const r: any = await runOutreach();
      back.searchParams.set("msg", r.skipped ? `Not sent: ${r.skipped}` : `Sent ${r.sent}, failed ${r.failed}.`);
    } else if (a === "status") {
      const id = Number(f.get("id")), st = String(f.get("to"));
      if (st === "replied") await sql`UPDATE prospects SET status = 'replied', replied_at = now(), next_send_at = NULL WHERE id = ${id}`;
      if (st === "customer") await sql`UPDATE prospects SET status = 'customer', customer_at = now(), next_send_at = NULL WHERE id = ${id}`;
      if (st === "dnc") { const [p] = await sql`SELECT email FROM prospects WHERE id = ${id}` as any[]; if (p) await suppress(p.email, "do-not-contact"); }
    } else if (a === "dnc") {
      for (const e of String(f.get("emails") ?? "").split(/[\s,;]+/).filter(x => x.includes("@"))) await suppress(e, "do-not-contact");
      back.searchParams.set("msg", "Added to the do-not-contact list.");
    }
  } catch (e) { back.searchParams.set("msg", (e as Error).message); }
  return NextResponse.redirect(back, 303);
}
