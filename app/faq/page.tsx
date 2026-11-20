import { FAQ } from "@/lib/faq";
export const metadata = { title: "FAQ | Lokly", description: "Answers about Lokly pricing, Google Business Profile management, the free Google report and free Lokly Menu." };
export default function Faq() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <main className="sc-hero"><div className="wrap bl-art" style={{ paddingTop: 0 }}>
      <h1>Questions owners ask us</h1>
      {FAQ.map(([q, a]) => <details key={q} className="faq-i" open><summary>{q}</summary><p>{a}</p></details>)}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </div></main>
  );
}
