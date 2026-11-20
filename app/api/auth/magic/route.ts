import { NextResponse } from "next/server";
import { verifyMagic } from "@/lib/magic";
import { createSession } from "@/lib/auth";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = verifyMagic(u.searchParams.get("t") ?? "");
  const next = (u.searchParams.get("next") ?? "/app").startsWith("/") ? u.searchParams.get("next")! : "/app";
  if (!id) return NextResponse.redirect(new URL("/login?expired=1", req.url), 303);
  await createSession(id);
  return NextResponse.redirect(new URL(next, req.url), 303);
}
