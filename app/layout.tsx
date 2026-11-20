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
  return <html lang="en" className={archivo.variable}><head><script dangerouslySetInnerHTML={{ __html: 'try{var q=new URLSearchParams(location.search),u=navigator.userAgent,s=q.get("utm_source")||(/Instagram/i.test(u)?"instagram":/FBAN|FBAV|FB_IAB/i.test(u)||q.get("fbclid")?"facebook":null);if(s){sessionStorage.setItem("lokly_src",s);if(!q.get("utm_source")){q.set("utm_source",s);q.set("utm_medium",q.get("fbclid")?"paid":"social");if(!q.get("src"))q.set("src",s);history.replaceState(null,"",location.pathname+"?"+q+location.hash)}}}catch(e){}' }} /></head><body><Attribution /><Nav /><div id="main">{children}</div><Footer /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: '{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://lokly.pro/#org","name":"Lokly","url":"https://lokly.pro","logo":"https://lokly.pro/icon-512.png","email":"hello@lokly.pro","telephone":"+1-323-332-0577","description":"Local marketing platform for small businesses: Google Business Profile management, websites, reviews, social media, email, postcards and ads in one place.","sameAs":["https://maps.google.com/maps?cid=10326709323542603846"]},{"@type":"ProfessionalService","@id":"https://lokly.pro/#local","name":"Lokly","parentOrganization":{"@id":"https://lokly.pro/#org"},"url":"https://lokly.pro","image":"https://lokly.pro/icon-512.png","telephone":"+1-323-332-0577","priceRange":"$25-$299","address":{"@type":"PostalAddress","streetAddress":"685 S New Hampshire Ave","addressLocality":"Los Angeles","addressRegion":"CA","postalCode":"90005","addressCountry":"US"},"areaServed":["Los Angeles","Southern California","United States"],"hasOfferCatalog":{"@type":"OfferCatalog","name":"Lokly services","itemListElement":[{"@type":"Offer","name":"Google Business Profile management","price":"25","priceCurrency":"USD"},{"@type":"Offer","name":"Website package","price":"299","priceCurrency":"USD"},{"@type":"Offer","name":"Lokly Pro","price":"99","priceCurrency":"USD"},{"@type":"Offer","name":"Free Google report","price":"0","priceCurrency":"USD"},{"@type":"Offer","name":"Lokly Menu (free online menu)","price":"0","priceCurrency":"USD"}]}}]}' }} /><script defer src="/_vercel/insights/script.js" /></body></html>;
}
