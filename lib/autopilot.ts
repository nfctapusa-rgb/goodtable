// Weekly social autopilot. Every Monday the cron drafts 3 posts per client with social on.
// autopilot = publish on schedule; otherwise the owner approves in their dashboard first.
import { db } from "./db";
import { draftsFor } from "./postdrafts";
import { schedulePost, ayrshareReady, linkedNetworks } from "./ayrshare";

const DAY: Record<string, [number, number]> = { Offer: [0, 11], Review: [2, 18], Weekend: [4, 12] }; // [days after Monday, hour LA]
export const weekNo = (d = new Date()) => Math.floor((d.getTime() - 4 * 864e5) / (7 * 864e5)); // weeks start Monday

function slot(kind: string) {
  const now = new Date();
  const la = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const monday = new Date(la); monday.setDate(la.getDate() - ((la.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
  const [d, h] = DAY[kind] ?? [1, 12];
  const t = new Date(monday); t.setDate(monday.getDate() + d); t.setHours(h, 0, 0, 0);
  const offset = la.getTime() - now.getTime();
  const utc = new Date(t.getTime() - offset);
  return utc.getTime() < Date.now() + 15 * 60e3 ? new Date(Date.now() + 30 * 60e3) : utc;
}

export async function publish(postId: number) {
  const sql = await db();
  const [p] = await sql`SELECT p.*, b.social FROM posts p JOIN businesses b ON b.id = p.business_id WHERE p.id = ${postId}` as any[];
  if (!p || p.status === "scheduled" || p.status === "posted") return p;
  if (!ayrshareReady() || !p.social?.profileKey) {
    await sql`UPDATE posts SET status = 'approved' WHERE id = ${postId}`; // our team posts it manually
    return p;
  }
  try {
    const media = /^https:\/\//.test(p.photo ?? "") ? p.photo : undefined;
    // Post to whatever the client linked. TikTok and Instagram need an image, so they're skipped on text-only posts.
    const linked = await linkedNetworks(p.social.profileKey).catch(() => ["instagram", "facebook"]);
    const platforms = linked.filter((n: string) => n === "facebook" || ((n === "instagram" || n === "tiktok") && media));
    if (!platforms.length) throw new Error(media ? "No connected Instagram, Facebook or TikTok" : "Needs a photo for Instagram/TikTok and Facebook isn't connected");
    const j = await schedulePost(p.social.profileKey, { text: p.caption, mediaUrl: media, when: new Date(p.scheduled_for).toISOString(), platforms });
    await sql`UPDATE posts SET status = 'scheduled', ayrshare_id = ${j.id ?? null}, error = NULL WHERE id = ${postId}`;
    await sql`INSERT INTO results (business_id, kind, title, detail) VALUES (${p.business_id}, 'Social post', ${`${p.kind} post scheduled for ${new Date(p.scheduled_for).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "America/Los_Angeles" })}`}, ${p.caption.slice(0, 140)})`;
  } catch (e) {
    await sql`UPDATE posts SET status = 'error', error = ${(e as Error).message.slice(0, 300)} WHERE id = ${postId}`;
  }
  return p;
}

export async function runWeekly() {
  const sql = await db();
  const wk = weekNo();
  const bizs = await sql`SELECT * FROM businesses WHERE status IN ('active', 'trial') AND (plan = 'pro' OR addons ? 'social')` as any[];
  let drafted = 0, published = 0;
  for (const b of bizs) {
    const drafts = await draftsFor(b);
    for (const d of drafts) {
      const [row] = await sql`INSERT INTO posts (business_id, kind, caption, photo, scheduled_for, week)
        VALUES (${b.id}, ${d.kind}, ${d.caption}, ${d.photo ?? null}, ${slot(d.kind).toISOString()}, ${wk})
        ON CONFLICT (business_id, week, kind) DO NOTHING RETURNING id` as any[];
      if (!row) continue;
      drafted++;
      if (b.social?.autopilot) { await publish(row.id); published++; }
    }
  }
  return { businesses: bizs.length, drafted, published };
}
