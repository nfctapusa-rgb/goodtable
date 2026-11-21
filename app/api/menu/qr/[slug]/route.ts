import QRCode from "qrcode";
import { menuUrl } from "@/lib/menus";
// Printable QR code (SVG) for a menu link. ?t=<table> makes a per-table code so scans are counted by table.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = new URL(req.url).searchParams.get("t");
  const table = /^\d{1,3}$/.test(t ?? "") ? `&t=${t}` : "";
  const svg = await QRCode.toString(menuUrl(slug.replace(/[^\w-]/g, "")) + "?src=qr" + table, { type: "svg", margin: 1, width: 600, color: { dark: "#142133", light: "#ffffff" } });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
}
