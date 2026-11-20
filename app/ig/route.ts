import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ATTR_COOKIE, parseAttr, track, type Attr } from "@/lib/track";

// The link ManyChat sends in the "GRADE" DM: https://lokly.pro/ig?h={{username}}&c=grade
// Logs the click, tags the visitor as Instagram (first touch wins), and opens the grader.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const existing = parseAttr(req.headers.get("cookie")?.match(/(?:^|;\s*)lokly_attr=([^;]+)/)?.[1]);
  const fresh: Attr = {
    s: "instagram", m: "dm", c: (u.searchParams.get("c") || "grade").slice(0, 40),
    h: u.searchParams.get("h")?.replace(/[^\w.]/g, "").slice(0, 40) || undefined,
    v: randomUUID(), t: Date.now(),
  };
  const attr = existing.s ? existing : fresh;
  await track("click", { attr: fresh, meta: fresh.h ? { ig: fresh.h } : undefined });
  const res = NextResponse.redirect(new URL("/grader?src=instagram", u.origin), 302);
  if (!existing.s) res.cookies.set(ATTR_COOKIE, JSON.stringify(attr), { path: "/", maxAge: 90 * 86400, sameSite: "lax", secure: true });
  return res;
}
