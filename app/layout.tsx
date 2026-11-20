import "./globals.css";
import "./dash.css";
import "./preview.css";
import "./home.css";
import "./street.css";
import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
import { Nav, Footer } from "./ui";
import { Attribution } from "./attribution";

export const metadata: Metadata = {
  title: "Lokly | Get found by the people on your block",
  description: "Lokly builds local business websites and manages Google Business Profiles in Los Angeles. Google profile management $25/mo. Website packages $299 with 3 months of management free.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={archivo.variable}><body><Attribution /><Nav /><div id="main">{children}</div><Footer /></body></html>;
}
