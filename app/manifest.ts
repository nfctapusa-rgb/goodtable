import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lokly", short_name: "Lokly", description: "Your Google results: views, calls, directions and reviews.",
    start_url: "/app", scope: "/", display: "standalone", background_color: "#F4F7F9", theme_color: "#142133",
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  };
}
