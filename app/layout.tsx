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
  description: "Lokly builds local business websites and manages Google Business Profiles in Los Angeles. Google profile management from $25/mo. Website packages $299 with 3 months of management free.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={archivo.variable}><head><script dangerouslySetInnerHTML={{ __html: 'try{var q=new URLSearchParams(location.search),u=navigator.userAgent,s=q.get("utm_source")||(/Instagram/i.test(u)?"instagram":/FBAN|FBAV|FB_IAB/i.test(u)||q.get("fbclid")?"facebook":null);if(s){sessionStorage.setItem("lokly_src",s);if(!q.get("utm_source")){q.set("utm_source",s);q.set("utm_medium",q.get("fbclid")?"paid":"social");if(!q.get("src"))q.set("src",s);history.replaceState(null,"",location.pathname+"?"+q+location.hash)}}}catch(e){}' }} /></head><body><Attribution /><Nav /><div id="main">{children}</div><Footer /><script defer src="/_vercel/insights/script.js" /></body></html>;
}
