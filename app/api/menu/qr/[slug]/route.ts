import QRCode from "qrcode";
import { menuUrl } from "@/lib/menus";
// Printable QR code (SVG) for a menu link: tables, windows, NFC cards.
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const svg = await QRCode.toString(menuUrl(slug.replace(/[^\w-]/g, "")) + "?src=qr", { type: "svg", margin: 1, width: 600, color: { dark: "#142133", light: "#ffffff" } });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
}
