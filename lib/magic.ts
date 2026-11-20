// Passwordless sign-in links for owners: /api/auth/magic?t=<userId>.<expires>.<sig>
import { createHmac, timingSafeEqual } from "crypto";
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://lokly.pro";
const key = () => process.env.EMAIL_SIGNING_SECRET || process.env.CRON_SECRET || "";
const sign = (s: string) => createHmac("sha256", key()).update(`magic:${s}`).digest("base64url").slice(0, 32);

export function magicUrl(userId: string, days = 7, next = "/app") {
  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  return `${SITE()}/api/auth/magic?t=${userId}.${exp}.${sign(`${userId}.${exp}`)}&next=${encodeURIComponent(next)}`;
}
export function verifyMagic(t: string): string | null {
  const [u, exp, sig] = t.split(".");
  if (!u || !exp || !sig || Number(exp) < Date.now() / 1000) return null;
  const e = sign(`${u}.${exp}`);
  return sig.length === e.length && timingSafeEqual(Buffer.from(sig), Buffer.from(e)) ? u : null;
}

export function signInHtml(name: string | null, url: string, intro = "Tap below to see your results. The link works for 24 hours.") {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://lokly.pro";
  return `<!doctype html><html><body style="margin:0;background:#F4F7F9;font-family:Arial,Helvetica,sans-serif;color:#142133"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #DCE3E9;border-radius:16px"><tr><td style="padding:22px 28px;border-bottom:1px solid #DCE3E9;font-weight:800;font-size:22px"><img src="${SITE}/pin-96.png" width="28" height="28" alt="" style="vertical-align:-6px"> Lokly</td></tr>
<tr><td style="padding:26px 28px"><p style="font-size:16px;margin:0 0 14px">Hi ${name ? name.split(" ")[0] : "there"},</p><p style="font-size:15px;line-height:1.55;margin:0 0 20px">${intro}</p>
<a href="${url}" style="background:#142133;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700;display:inline-block">Open my results</a>
<p style="font-size:13px;color:#5F6B7A;margin:22px 0 0">Tip: once it's open on your phone, tap Share, then "Add to Home Screen" to keep Lokly one tap away.</p></td></tr></table></td></tr></table></body></html>`;
}
