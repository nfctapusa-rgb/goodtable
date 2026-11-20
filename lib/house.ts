// Lokly's own Instagram, Facebook and TikTok. One Ayrshare profile for Lokly, stored in settings.
// Weekly: 3 posts that push the free grader ("Comment GRADE"). Autopilot on = scheduled straight away,
// off = they wait at /admin/social for approval.
import { db } from "./db";
import { ayrshareReady, connectUrl, linkedNetworks, schedulePost } from "./ayrshare";
import { weekNo } from "./autopilot";

const API = "https://api.ayrshare.com/api";
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://lokly.pro";
export const HOUSE_NETWORKS = ["instagram", "facebook", "tiktok"];

export async function getHouse(): Promise<{ profileKey?: string; autopilot?: boolean }> {
  const sql = await db();
  const [r] = await sql`SELECT value FROM settings WHERE key = 'house_social'` as any[];
  return r?.value ?? {};
}
export async function setHouse(patch: Record<string, unknown>) {
  const sql = await db();
  await sql`INSERT INTO settings (key, value) VALUES ('house_social', ${JSON.stringify(patch)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = settings.value || EXCLUDED.value, updated_at = now()`;
}

export async function houseProfileKey() {
  const h = await getHouse();
  if (h.profileKey) return h.profileKey;
  const r = await fetch(`${API}/profiles/profile`, { method: "POST", headers: { Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ title: "Lokly (house)" }) });
  const j = await r.json();
  if (!r.ok || !j.profileKey) throw new Error(j.message ?? "Couldn't create Ayrshare profile");
  await setHouse({ profileKey: j.profileKey });
  return j.profileKey as string;
}
export const houseConnectUrl = async () => connectUrl(await houseProfileKey());
export async function houseLinked() {
  const h = await getHouse();
  if (!h.profileKey || !ayrshareReady()) return [];
  return linkedNetworks(h.profileKey).catch(() => []);
}

// Content library. Each has a headline for the branded image (/api/og/post) and a caption.
const LIB: { kind: string; head: string; sub: string; caption: string }[] = [
  { kind: "Grader", head: "Is your shop invisible on Google?", sub: "Free report in 60 seconds", caption: "Most LA shops are missing 3 to 5 easy fixes on Google that cost them calls every week.\n\nComment GRADE and we'll DM you a free report for your business. No signup needed.\n\n#smallbusinessla #losangelesbusiness #localseo #googlebusinessprofile #shoplocalLA" },
  { kind: "Tip", head: "Reply to every Google review", sub: "Even the 5-star ones", caption: "Google ranks active profiles higher. Answering every review, good or bad, is the easiest free win there is.\n\nWant to see how your profile scores? Comment GRADE.\n\n#smallbusinesstips #googlereviews #localmarketing #losangeles" },
  { kind: "Proof", head: "3 businesses are beating you", sub: "on the map near you. See who.", caption: "When someone nearby searches for what you sell, Google shows 3 shops on the map. Are you one of them?\n\nComment GRADE and we'll send your free ranking report.\n\n#localseo #googlemaps #smallbusinessowner #LAsmallbusiness" },
  { kind: "Grader", head: "Your Google profile, graded", sub: "Photos, reviews, hours, website, rankings", caption: "We check your Google profile, website and local ranking and show you exactly what to fix, in plain English.\n\nComment GRADE for your free report.\n\n#smallbusiness #googlebusiness #localbusiness #losangeles" },
  { kind: "Tip", head: "Post on Google every week", sub: "Offers, photos, news", caption: "Weekly Google posts tell Google you're open and active. Shops that post show up more in nearby searches.\n\nWe do it for you for $25/mo. Comment GRADE to see where you stand first.\n\n#googlebusinessprofile #localmarketing #smallbusinesstips" },
  { kind: "Proof", head: "No website? You're losing orders", sub: "Customers can't buy what they can't find", caption: "If people can't order or book online, they go to the shop down the street that lets them.\n\nComment GRADE and we'll show you what your customers see.\n\n#smallbusinessla #websitedesign #onlineordering #shoplocal" },
];

export const imageUrl = (head: string, sub: string) => `${SITE()}/api/og/post?h=${encodeURIComponent(head)}&s=${encodeURIComponent(sub)}`;

function slotUtc(dayAfterMonday: number, hourLA: number) {
  const now = new Date();
  const la = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const t = new Date(la); t.setDate(la.getDate() - ((la.getDay() + 6) % 7) + dayAfterMonday); t.setHours(hourLA, 0, 0, 0);
  const utc = new Date(t.getTime() - (la.getTime() - now.getTime()));
  return utc.getTime() < Date.now() + 15 * 60e3 ? new Date(Date.now() + 30 * 60e3) : utc;
}

export async function publishHouse(id: number) {
  const sql = await db();
  const [p] = await sql`SELECT * FROM house_posts WHERE id = ${id}` as any[];
  if (!p || p.status === "scheduled") return;
  const h = await getHouse();
  if (!ayrshareReady() || !h.profileKey) { await sql`UPDATE house_posts SET status = 'error', error = 'Connect Lokly socials first' WHERE id = ${id}`; return; }
  const linked = await houseLinked();
  const platforms = (p.platforms as string[]).filter(x => linked.includes(x));
  if (!platforms.length) { await sql`UPDATE house_posts SET status = 'error', error = 'None of the chosen networks are connected' WHERE id = ${id}`; return; }
  try {
    const j = await schedulePost(h.profileKey, { text: p.caption, mediaUrl: p.image ?? undefined, when: new Date(p.scheduled_for).toISOString(), platforms });
    await sql`UPDATE house_posts SET status = 'scheduled', ayrshare_id = ${j.id ?? null}, error = NULL WHERE id = ${id}`;
  } catch (e) {
    await sql`UPDATE house_posts SET status = 'error', error = ${(e as Error).message.slice(0, 300)} WHERE id = ${id}`;
  }
}

// Drafts this week's 3 house posts (Mon 11am, Wed 6pm, Fri 12pm LA); schedules them if autopilot is on.
export async function runHouseWeekly() {
  const sql = await db();
  const wk = weekNo();
  const h = await getHouse();
  const slots: [number, number][] = [[0, 11], [2, 18], [4, 12]];
  let drafted = 0;
  for (let i = 0; i < 3; i++) {
    const item = LIB[(wk * 3 + i) % LIB.length];
    const [row] = await sql`INSERT INTO house_posts (kind, caption, image, platforms, scheduled_for, week)
      VALUES (${`${item.kind} ${i + 1}`}, ${item.caption}, ${imageUrl(item.head, item.sub)}, ${HOUSE_NETWORKS}, ${slotUtc(...slots[i]).toISOString()}, ${wk})
      ON CONFLICT (week, kind) DO NOTHING RETURNING id` as any[];
    if (!row) continue;
    drafted++;
    if (h.autopilot) await publishHouse(row.id);
  }
  return { drafted, autopilot: !!h.autopilot };
}
