import { placesKey } from "@/lib/places";

// Proxies a Google Places photo so the API key never reaches the browser.
export async function GET(req: Request) {
  const n = new URL(req.url).searchParams.get("n") ?? "";
  if (!placesKey() || !/^places\/[\w-]+\/photos\/[\w-]+$/.test(n)) return new Response("Not found", { status: 404 });
  const r = await fetch(`https://places.googleapis.com/v1/${n}/media?maxWidthPx=1200&skipHttpRedirect=true`, { headers: { "X-Goog-Api-Key": placesKey() } });
  if (!r.ok) return new Response("Not found", { status: 404 });
  const { photoUri } = await r.json();
  return Response.redirect(photoUri, 302);
}
