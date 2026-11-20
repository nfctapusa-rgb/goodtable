// Ayrshare: posts to clients' Instagram, Facebook and TikTok. Each business gets its own Ayrshare
// "user profile"; the owner links their accounts through Ayrshare's hosted page (JWT link).
// Env: AYRSHARE_API_KEY, AYRSHARE_PRIVATE_KEY (PEM), AYRSHARE_DOMAIN (from Ayrshare dashboard).
import { db } from "./db";

const API = "https://api.ayrshare.com/api";
export const ayrshareReady = () => !!process.env.AYRSHARE_API_KEY;

async function call(path: string, body?: unknown, profileKey?: string, method = body ? "POST" : "GET") {
  const r = await fetch(`${API}/${path}`, {
    method, headers: { Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`, "Content-Type": "application/json", ...(profileKey ? { "Profile-Key": profileKey } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status === "error") throw new Error(j.message ?? `Ayrshare ${r.status}`);
  return j;
}

// Creates the business's Ayrshare profile once and stores its key in businesses.social.
export async function profileKeyFor(businessId: string, name: string) {
  const sql = await db();
  const [b] = await sql`SELECT social FROM businesses WHERE id = ${businessId}` as any[];
  if (b?.social?.profileKey) return b.social.profileKey as string;
  const j = await call("profiles", { title: `${name.slice(0, 60)} (${businessId.slice(0, 8)})` });
  await sql`UPDATE businesses SET social = COALESCE(social, '{}'::jsonb) || ${JSON.stringify({ profileKey: j.profileKey, refId: j.refId })}::jsonb WHERE id = ${businessId}`;
  return j.profileKey as string;
}

// One-time link the owner opens to connect their socials.
export async function connectUrl(profileKey: string, redirect: string) {
  const j = await call("profiles/generateJWT", {
    domain: process.env.AYRSHARE_DOMAIN, privateKey: (process.env.AYRSHARE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    profileKey, redirect, allowedSocial: ["instagram", "facebook", "tiktok"], expiresIn: 30,
  });
  return j.url as string;
}

export async function linkedNetworks(profileKey: string): Promise<string[]> {
  const j = await call("user", undefined, profileKey);
  return j.activeSocialAccounts ?? [];
}

export async function schedulePost(profileKey: string, p: { text: string; mediaUrl?: string; when?: string; platforms?: string[] }) {
  return call("post", {
    post: p.text, platforms: p.platforms ?? ["instagram", "facebook"],
    ...(p.mediaUrl ? { mediaUrls: [p.mediaUrl] } : {}), ...(p.when ? { scheduleDate: p.when } : {}),
  }, profileKey);
}
