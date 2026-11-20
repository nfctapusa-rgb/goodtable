"use client";
import { useEffect } from "react";

// Saves first-touch marketing tags (?utm_source= / ?src=) in a cookie so the grader,
// signup and checkout can credit the right channel. Never overwrites an earlier touch.
export function Attribution() {
  useEffect(() => {
    try {
      const has = document.cookie.split("; ").some(c => c.startsWith("lokly_attr="));
      const p = new URLSearchParams(location.search);
      const s = p.get("utm_source") || p.get("src");
      if (has || !s) return;
      const v = crypto.randomUUID();
      const attr = { s, m: p.get("utm_medium") || undefined, c: p.get("utm_campaign") || undefined, v, t: Date.now() };
      document.cookie = `lokly_attr=${encodeURIComponent(JSON.stringify(attr))}; path=/; max-age=${90 * 86400}; samesite=lax; secure`;
    } catch {}
  }, []);
  return null;
}
