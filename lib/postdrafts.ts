// Weekly social post drafts per client, built from their brand kit, offers and Google reviews.
// Copy-paste into Meta Business Suite Planner until automated posting (Ayrshare) is on.
import { getReviews, placesKey } from "./places";

export interface Draft { kind: string; when: string; caption: string; photo?: string }

const tagify = (s?: string | null) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const week = () => Math.floor(Date.now() / (7 * 864e5));

export async function draftsFor(b: { name: string; city?: string | null; category?: string | null; place_id?: string | null; website?: string | null; assets?: any; setup?: any }): Promise<Draft[]> {
  const photos: string[] = b.assets?.photos ?? [];
  const pick = (i: number) => photos.length ? photos[(week() + i) % photos.length] : undefined;
  const city = b.city ?? "LA";
  const tags = ["#" + tagify(b.name), "#" + tagify(city) + (b.category ? tagify(b.category) : "local"), "#shoplocal", "#" + tagify(city)].filter(t => t.length > 2).slice(0, 4).join(" ");
  const link = b.website ? `\n\n🔗 ${b.website.replace(/^https?:\/\//, "")}` : "";
  const reviewLink = b.place_id ? `https://search.google.com/local/writereview?placeid=${b.place_id}` : null;
  const out: Draft[] = [];

  const offer = (b.setup?.offer as string) || (b.setup?.notes as string)?.match(/[^.]*(\d+%|free|deal|special|off)[^.]*/i)?.[0]?.trim();
  out.push({ kind: "Offer", when: "Monday 11am", photo: pick(0), caption: offer
    ? `This week at ${b.name}: ${offer} 🙌\n\nCome see us in ${city}. Show this post at the counter.${link}\n\n${tags}`
    : `New week, same love for ${city}. Stop by ${b.name} and say hi. Ask about this week's special 👀${link}\n\n${tags}` });

  let review: { author: string; text: string } | undefined;
  if (b.place_id && placesKey()) {
    const rs = (await getReviews(b.place_id).catch(() => [])).filter(r => r.rating >= 5 && r.text.length > 40);
    review = rs[week() % Math.max(rs.length, 1)];
  }
  out.push({ kind: "Review", when: "Wednesday 6pm", photo: pick(1), caption: review
    ? `⭐⭐⭐⭐⭐ "${review.text.length > 220 ? review.text.slice(0, 217).trim() + "…" : review.text}"\n\n— ${review.author.split(" ")[0]}, on Google\n\nThank you! Reviews like this keep us going.${reviewLink ? `\n\nLeave us one: ${reviewLink}` : ""}\n\n${tags}`
    : `We read every review and they make our day. If we've taken care of you, a quick Google review helps a ton 🙏${reviewLink ? `\n\n${reviewLink}` : ""}\n\n${tags}` });

  out.push({ kind: "Weekend", when: "Friday 12pm", photo: pick(2), caption: `Weekend plans? ${b.name} is open and ready for you. ${b.category ? `Best ${b.category.toLowerCase()} in ${city}, if you ask our regulars.` : ""}\n\nTag who you're bringing 👇${link}\n\n${tags}` });
  return out;
}
