import { createHmac } from "crypto";
// Permanent, unguessable view link for a business's results (no login), safe to text to an owner.
const secret = () => process.env.SHARE_SECRET || process.env.DATABASE_URL || "lokly";
const sig = (id: string) => createHmac("sha256", secret()).update("view:" + id).digest("base64url").slice(0, 16);
export const shareToken = (id: string) => `${id}.${sig(id)}`;
export function verifyShare(t: string): string | null {
  const [id, s] = t.split(".");
  return id && s && /^[0-9a-f-]{36}$/.test(id) && sig(id) === s ? id : null;
}
export const shareUrl = (id: string) => `https://lokly.pro/v/${shareToken(id)}`;
