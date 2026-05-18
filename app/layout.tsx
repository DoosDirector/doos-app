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
  manifest: "/manifest.json",
  openGraph: {
    siteName: "Doo's",
    type:     "website",
    locale:   "en_GB",
  },
  twitter: {
    card: "summary_large_image",
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
        <Providers>{children}</Providers>
        <GoogleMapsScript />
      </body>
    </html>
  )
}
