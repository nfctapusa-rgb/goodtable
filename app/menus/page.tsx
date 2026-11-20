import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export const metadata = { title: "Menus, specials & events near you | Lokly", description: "Browse local restaurant and bar menus, specials and events." };
export default async function Menus() {
  const sql = await db();
  const rows = await sql`SELECT slug, name, city, kind, logo, data->'specials' AS specials FROM menus WHERE published AND jsonb_array_length(data->'sections') > 0 ORDER BY (jsonb_array_length(data->'specials') > 0) DESC, updated_at DESC LIMIT 100` as any[];
  return (
    <main className="sc-hero"><div className="wrap">
      <h1 className="sh-title sm">Menus & specials near you.</h1>
      <p className="sh-lead">Local restaurants, cafés and bars on Lokly Menu. <a href="/menu">Add yours free</a>.</p>
      <div className="bl-list">{rows.map(r => (
        <a key={r.slug} href={`/m/${r.slug}`} className="card bl-card mn-dir">
          {r.logo && <img src={r.logo} alt="" />}
          <h2>{r.name}</h2><p>{[r.kind, r.city].filter(Boolean).join(" · ")}</p>
          {r.specials?.[0] && <span className="bl-tag">Special: {r.specials[0].title}</span>}
        </a>))}
        {rows.length === 0 && <p className="muted">Be the first: <a href="/menu">add your menu free</a>.</p>}
      </div>
    </div></main>
  );
}
