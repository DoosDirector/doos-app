import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import { GoogleMapsScript } from "@/components/google-maps-script"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://doos.app"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Doo's – Team Events Made Easy",
    template: "%s – Doo's",
  },
  description:
    "Organise team nights out, lunches, and activities with polls, maps, RSVPs, and a shared Memory Box.",
  // manifest.json is served automatically from app/manifest.ts
  manifest: "/manifest.json",
  icons: {
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    icon:  [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable:        true,
    title:          "Doo's",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    siteName: "Doo's",
    type:     "website",
    locale:   "en_GB",
    images:   [{ url: "/og-default.png", width: 1200, height: 630, alt: "Doo's – Team Events Made Easy" }],
  },
  twitter: {
    card:   "summary_large_image",
    images: ["/og-default.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-GB" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        <GoogleMapsScript />
      </body>
    </html>
  )
}
