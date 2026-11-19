export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="narrow legal">
      <section className="hero">
        <p className="kicker">Last updated {updated}</p>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}
