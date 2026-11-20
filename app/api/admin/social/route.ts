import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { houseConnectUrl, setHouse, publishHouse, runHouseWeekly, imageUrl, HOUSE_NETWORKS } from "@/lib/house";

// Admin actions for Lokly's own socials: connect, autopilot toggle, draft week, approve, edit, skip, post a custom one.
export async function POST(req: Request) {
  const f = await req.formData();
  const key = String(f.get("key") ?? "");
  const user = await currentUser().catch(() => null);
  if (!user?.is_admin && !(process.env.ADMIN_KEY && key === process.env.ADMIN_KEY)) return new NextResponse("Not found", { status: 404 });
  const back = new URL(`/admin/social${key ? `?key=${encodeURIComponent(key)}` : ""}`, req.url);
  const action = String(f.get("action") ?? "");
  const sql = await db();
  try {
    if (action === "connect") return NextResponse.redirect(await houseConnectUrl(), 303);
    if (action === "autopilot") await setHouse({ autopilot: f.get("on") === "1" });
    if (action === "draft") await runHouseWeekly();
    const id = Number(f.get("id") ?? 0);
    if (action === "approve" && id) {
      const caption = String(f.get("caption") ?? "").trim();
      const platforms = HOUSE_NETWORKS.filter(n => f.get(`p_${n}`));
      if (caption) await sql`UPDATE house_posts SET caption = ${caption.slice(0, 2200)} WHERE id = ${id} AND status <> 'scheduled'`;
      if (platforms.length) await sql`UPDATE house_posts SET platforms = ${platforms} WHERE id = ${id} AND status <> 'scheduled'`;
      await sql`UPDATE house_posts SET status = 'pending' WHERE id = ${id} AND status = 'error'`;
      await publishHouse(id);
    }
    if (action === "skip" && id) await sql`UPDATE house_posts SET status = 'skipped' WHERE id = ${id} AND status <> 'scheduled'`;
    if (action === "custom") {
      const caption = String(f.get("caption") ?? "").trim().slice(0, 2200);
      if (!caption) throw new Error("Write a caption first.");
      const when = String(f.get("when") ?? "");
      const at = when ? new Date(when) : new Date(Date.now() + 20 * 60e3);
      const head = String(f.get("head") ?? "").trim().slice(0, 90) || "Free Google report";
      const platforms = HOUSE_NETWORKS.filter(n => f.get(`p_${n}`));
      const [row] = await sql`INSERT INTO house_posts (kind, caption, image, platforms, scheduled_for, week)
        VALUES (${`Custom ${Date.now()}`}, ${caption}, ${imageUrl(head, String(f.get("sub") ?? "").slice(0, 90) || "lokly.pro")}, ${platforms.length ? platforms : HOUSE_NETWORKS}, ${at.toISOString()}, -1) RETURNING id` as any[];
      await publishHouse(row.id);
    }
    back.searchParams.set("ok", action);
  } catch (e) { back.searchParams.set("err", (e as Error).message.slice(0, 200)); }
  return NextResponse.redirect(back, 303);
}
