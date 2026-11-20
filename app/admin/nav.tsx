// One menu across every admin page.
const LINKS: [string, string][] = [["", "Today"], ["/outreach", "Outreach"], ["/growth", "Growth"], ["/social", "Lokly socials"], ["/posts", "Client posts"]];
export function AdminNav({ k, on }: { k?: string; on: string }) {
  const q = k ? `?key=${encodeURIComponent(k)}` : "";
  return (
    <nav className="adnav" aria-label="Admin">
      {LINKS.map(([p, l]) => <a key={p} href={`/admin${p}${q}`} className={on === p ? "on" : ""} aria-current={on === p ? "page" : undefined}>{l}</a>)}
      <a href={`/admin${q}#clients`}>Clients</a>
    </nav>
  );
}
