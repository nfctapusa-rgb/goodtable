import QRCode from "qrcode";

export const metadata = { title: "Lokly QR card", robots: { index: false } };

// Printable leave-behind card. ?src= tags where the scan came from (card, flyer, counter).
export default async function QR({ searchParams }: { searchParams: Promise<{ src?: string; host?: string }> }) {
  const { src = "card", host = "lokly.pro" } = await searchParams;
  const url = `https://${host.replace(/[^a-z0-9.-]/gi, "")}/grader?src=${encodeURIComponent(src)}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#101318", light: "#ffffff" } });
  return (
    <main className="qrpage">
      <div className="qrcard">
        <p className="kicker">Free · 60 seconds</p>
        <h1>Is your business showing up on Google?</h1>
        <div className="qrimg" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="qrhow">Scan with your phone camera and get your free visibility report.</p>
        <div className="qrfoot"><b><span className="mark" />Lokly</b><span>lokly.pro</span></div>
      </div>
      <p className="tiny muted noprint">Links to <code>{url}</code>. Print with Ctrl/Cmd + P. Change the source tag with <code>?src=flyer</code>.</p>
    </main>
  );
}
