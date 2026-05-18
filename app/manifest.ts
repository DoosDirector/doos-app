import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "Doo's – Team Events Made Easy",
    short_name:       "Doo's",
    description:      "Organise team nights out, lunches, and activities with polls, maps, RSVPs, and a shared Memory Box.",
    start_url:        "/",
    scope:            "/",
    display:          "standalone",
    orientation:      "portrait",
    theme_color:      "#0d9488",
    background_color: "#ffffff",
    categories:       ["social", "productivity", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png",          sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png",          sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [],
  }
}
