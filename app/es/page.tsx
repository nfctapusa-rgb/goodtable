import { LangLanding, type LangCopy } from "@/lib/i18n-pages";
export const metadata = { title: "Marketing para negocios locales en Los Ángeles | Lokly", description: "Más clientes desde Google para restaurantes, taquerías, barberías y negocios latinos en Los Ángeles. Reporte gratis y menú digital gratis.",
  alternates: { canonical: "https://lokly.pro/es", languages: { en: "https://lokly.pro", es: "https://lokly.pro/es", ko: "https://lokly.pro/ko" } } };
const c: LangCopy = { lang: "es",
  title: "Más clientes desde Google para tu negocio.",
  lead: "Lokly maneja tu perfil de Google, hace tu página web y te consigue más reseñas de 5 estrellas. Para restaurantes, taquerías, food trucks, barberías, salones y tiendas en Los Ángeles. Hablamos español y vamos a tu negocio.",
  cta: "Ver mi reporte gratis", note: "Reporte gratis en un minuto. Sin registrarte.",
  whatH: "Lo que hacemos por ti",
  what: [["Perfil de Google", "Publicaciones cada semana, fotos nuevas, horario correcto y tu perfil optimizado para que te encuentren en Google Maps."],
    ["Más reseñas", "Tarjeta NFC: tus clientes acercan el teléfono y dejan una reseña en segundos."],
    ["Página web", "Una página rápida para celular, con tu menú, botón de llamar y cómo llegar."],
    ["Redes sociales", "Publicaciones para Instagram, Facebook y TikTok hechas con tus fotos y ofertas."],
    ["Resultados en tu teléfono", "Ve cuántas personas te encontraron, te llamaron y pidieron direcciones."]],
  menuH: "Menú digital GRATIS para restaurantes", menuP: "Pon tu menú en línea gratis: tu logo, precios, especiales y un código QR para las mesas. Cámbialo cuando quieras desde tu celular.", menuCta: "Crear mi menú gratis",
  priceH: "Precios simples, sin contrato",
  prices: [["$25/mes", "Manejo de tu perfil de Google"], ["$299", "Página web + 3 meses gratis"], ["$99/mes", "Lokly Pro: todo incluido"]],
  proofH: "Resultados reales",
  proof: ["Restaurante en el centro de LA: +38% vistas en Google en 6 meses", "Barbería en DTLA: +53% llamadas desde Google", "Pizzería familiar: los clics a su página subieron de 5 a 124"],
  contactH: "¿Hablamos?", contactP: "Llama o manda texto al (323) 332-0577 o escribe a hello@lokly.pro. Estamos en el centro de Los Ángeles." };
export default function Es() { return <LangLanding c={c} />; }
