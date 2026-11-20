import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, businessFor } from "@/lib/auth";
import { planById } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome | Lokly", robots: { index: false } };

export default async function Welcome({ searchParams }: { searchParams: Promise<{ b?: string; paid?: string }> }) {
  const { b, paid } = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  const biz: any = b ? await businessFor(user.id, b) : null;
  if (!biz) redirect("/dashboard");
  const sql = await db();
  const tasks = await sql`SELECT key, title, who, done FROM tasks WHERE business_id = ${biz.id} ORDER BY sort` as any[];
  const plan = planById(biz.plan);
  const yours = tasks.filter(t => t.who === "owner" && !t.done);
  return (
    <main className="narrow welcome">
      <section className="hero">
        <p className="wl-badge">{paid ? "Payment received" : "You're signed up"}</p>
        <h1 className="sh-h2">Welcome to Lokly, {biz.name}.</h1>
        <p className="sh-lead">
          {plan?.name} is {paid ? "active" : "reserved"}.{" "}
          {biz.plan === "site" ? "Your first 3 months of Google management are free. We'll text you within one business day to start your website." : "We'll text you within one business day to get your Google profile set up."}
          {!paid && " We'll collect payment when we call."}
        </p>
        {yours.length > 0 && (
          <div className="wl-box">
            <b>What we need from you</b>
            <ol>{yours.map(t => <li key={t.key}>{t.title}</li>)}</ol>
            <p className="small muted">First step: add Lokly as a manager on your Google profile. Your dashboard walks you through it in 2 minutes.</p>
          </div>
        )}
        <a className="btn dark" href={`/dashboard?b=${biz.id}`}>Go to my dashboard</a>
      </section>
    </main>
  );
}
