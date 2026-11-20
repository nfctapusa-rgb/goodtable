import { ImageResponse } from "next/og";

export const runtime = "edge";

// Branded 1080x1350 image for Lokly's own posts (Instagram portrait, works on Facebook and TikTok photo posts).
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const head = (p.get("h") ?? "Is your shop invisible on Google?").slice(0, 90);
  const sub = (p.get("s") ?? "Free report in 60 seconds").slice(0, 90);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#142133", color: "#F4F7F9", padding: 90, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 52, fontWeight: 800 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: "#E30A23", marginRight: 18 }} />Lokly
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2 }}>{head}</div>
        <div style={{ fontSize: 46, marginTop: 34, color: "#FFD23F" }}>{sub}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 40 }}>
        <div style={{ background: "#FFD23F", color: "#142133", padding: "22px 34px", borderRadius: 18, fontWeight: 800 }}>Comment GRADE</div>
        <div style={{ color: "#9FB0C3" }}>lokly.pro</div>
      </div>
    </div>,
    { width: 1080, height: 1350 },
  );
}
