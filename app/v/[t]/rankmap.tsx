// 5x5 rank grid. Green = top 3 (shows in the Google map pack), yellow = 4-10, red = 11-20, gray = not in top 20.
export function RankMap({ cells, label, top3 }: { cells: { rank: number | null }[]; label: string; top3: number }) {
  const tone = (r: number | null) => (!r ? "rm-x" : r <= 3 ? "rm-g" : r <= 10 ? "rm-y" : "rm-r");
  return (
    <figure className="rm">
      <div className="rm-grid">{cells.map((c, i) => <span key={i} className={`${tone(c.rank)}${i === 12 ? " rm-c" : ""}`}>{c.rank ?? "20+"}</span>)}</div>
      <figcaption><b>{label}</b><span>Top 3 in {top3} of {cells.length} spots</span></figcaption>
    </figure>
  );
}
