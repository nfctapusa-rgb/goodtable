import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importCsv, startSequence, suppress, runOutreach } from "@/lib/outreach";

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
