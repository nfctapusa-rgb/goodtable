import { randomBytes } from "crypto";
export type MenuItem = { name: string; desc?: string; price?: string; photo?: string; tags?: string[] };
export type MenuSection = { name: string; items: MenuItem[] };
export type Special = { title: string; desc?: string; when?: string };
export type MenuData = { sections: MenuSection[]; specials: Special[]; hours?: string; about?: string; order?: string; instagram?: string };
export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 48) || "menu";
export const newToken = () => randomBytes(18).toString("base64url");
export const editUrl = (t: string) => `https://lokly.pro/menu/edit/${t}`;
export const menuUrl = (slug: string) => `https://lokly.pro/m/${slug}`;
// Keep stored images small: data URLs over ~350KB are rejected (the editor resizes before upload).
export const okImage = (v: unknown) => typeof v === "string" && (v === "" || /^https:\/\//.test(v) || (/^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length < 480_000)) ? v : null;
export function cleanData(d: any): MenuData {
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
  const sections = (Array.isArray(d?.sections) ? d.sections : []).slice(0, 30).map((s: any) => ({
    name: str(s?.name, 60), items: (Array.isArray(s?.items) ? s.items : []).slice(0, 80).map((i: any) => ({
      name: str(i?.name, 80), desc: str(i?.desc, 240), price: str(i?.price, 20), photo: okImage(i?.photo) ?? "",
      tags: (Array.isArray(i?.tags) ? i.tags : []).slice(0, 4).map((t: any) => str(t, 16)) })).filter((i: MenuItem) => i.name) })).filter((s: MenuSection) => s.name || s.items.length);
  const specials = (Array.isArray(d?.specials) ? d.specials : []).slice(0, 10).map((x: any) => ({ title: str(x?.title, 80), desc: str(x?.desc, 240), when: str(x?.when, 60) })).filter((x: Special) => x.title);
  return { sections, specials, hours: str(d?.hours, 300), about: str(d?.about, 600), order: /^https:\/\//.test(d?.order ?? "") ? str(d.order, 300) : "", instagram: str(d?.instagram, 40).replace(/^@/, "") };
}

// Each menu gets its own look: layout, type and texture, not just a color.
export const THEMES = {
  classic: { name: "Classic", note: "Serif type, dotted price lines" },
  bold: { name: "Bold", note: "Big condensed headings, color blocks" },
  warm: { name: "Café", note: "Cream paper, soft cards" },
  dark: { name: "Night", note: "Dark lounge look for bars" },
  minimal: { name: "Minimal", note: "Clean white, photo-first" },
} as const;
export type ThemeId = keyof typeof THEMES;
export const defaultTheme = (kind?: string | null): ThemeId => kind === "bar" ? "dark" : kind === "cafe" ? "warm" : kind === "food-truck" ? "bold" : "classic";
