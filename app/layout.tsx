import "./globals.css";
import "./dash.css";
import "./preview.css";
import type { Metadata, Viewport } from "next";
import { Nav, Footer } from "./ui";

export const metadata: Metadata = {
  title: "Lokly — Everything your business needs to grow online",
  description: "The AI platform any business uses to get found on Google, sell and book directly, and bring customers back. $49.99/month.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Nav />{children}<Footer /></body></html>;
}
