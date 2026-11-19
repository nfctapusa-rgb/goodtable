import { NextResponse } from "next/server";

// Turns a Google Maps link (full or maps.app.goo.gl share link) into name + coordinates. No API key needed.
const OK = /^(https?:\/\/)?((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs|share\.google)/i;

export async function GET(req: Request) {
  let u = new URL(req.url).searchParams.get("u")?.trim() ?? "";
  if (!OK.test(u)) return NextResponse.json({ error: "Paste the link from Google Maps (Share → Copy link)." }, { status: 400 });
  if (!/^https?:/.test(u)) u = "https://" + u;
  let final = u;
  try {
    for (let i = 0; i < 5; i++) {
      const r = await fetch(final, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0" } });
      const loc = r.headers.get("location");
      if (!loc || r.status < 300 || r.status >= 400) break;
      final = new URL(loc, final).toString();
    }
  } catch {}
  const dec = decodeURIComponent(final).replace(/\+/g, " ");
  const name = dec.match(/\/maps\/place\/([^/@?]+)/)?.[1]?.trim() || new URL(final).searchParams.get("q")?.split(",")[0]?.trim() || null;
  const at = dec.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? dec.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (!name) return NextResponse.json({ error: "We couldn't read that link. Try Share → Copy link in Google Maps, or enter your details below." }, { status: 422 });
  return NextResponse.json({ name, lat: at ? +at[1] : null, lng: at ? +at[2] : null, mapsUrl: final.slice(0, 500) });
}
