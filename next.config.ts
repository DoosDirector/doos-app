import type { NextConfig } from "next"
import { createRequire } from "module"

// next-pwa v5 is a CommonJS module — use createRequire to import it in ESM context
const require = createRequire(import.meta.url)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withPWA = require("next-pwa") as (pwaConfig: Record<string, any>) => (nextConfig: NextConfig) => NextConfig

const nextConfig: NextConfig = {
  // Dev uses Turbopack (fast refresh); production build uses --webpack so
  // next-pwa can inject its webpack plugin and generate sw.js + workbox files.
  turbopack: {},
}

export default withPWA({
  dest:        "public",
  register:    true,
  skipWaiting: true,

  // Disable service worker in development — hot-reload and SW don't mix well
  disable: process.env.NODE_ENV === "development",

  // ── Runtime caching rules ────────────────────────────────────────────────
  runtimeCaching: [
    // Next.js static chunks — long-lived, content-hashed filenames
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
      handler:    "CacheFirst",
      options: {
        cacheName: "next-static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    // Next.js image optimisation
    {
      urlPattern: /^https?:\/\/.*\/_next\/image\?.*/i,
      handler:    "StaleWhileRevalidate",
      options: {
        cacheName: "next-image",
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    // Supabase REST / Auth — NetworkFirst so data stays fresh
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/(rest|auth)\/.*/i,
      handler:    "NetworkFirst",
      options: {
        cacheName:             "supabase-api",
        networkTimeoutSeconds: 5,
        expiration:            { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
    // Supabase Storage (memory photos / videos) — CacheFirst for media
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
      handler:    "CacheFirst",
      options: {
        cacheName: "supabase-storage",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    // Google Maps API scripts
    {
      urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
      handler:    "CacheFirst",
      options: {
        cacheName: "google-maps",
        expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    // Google Maps tiles
    {
      urlPattern: /^https:\/\/maps\.gstatic\.com\/.*/i,
      handler:    "CacheFirst",
      options: {
        cacheName: "google-maps-static",
        expiration: { maxEntries: 100, maxAgeSeconds: 14 * 24 * 60 * 60 },
      },
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler:    "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    // Everything else — NetworkFirst with short cache fallback
    {
      urlPattern: /^https?.*/i,
      handler:    "NetworkFirst",
      options: {
        cacheName:             "others",
        networkTimeoutSeconds: 10,
        expiration:            { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
})(nextConfig)
