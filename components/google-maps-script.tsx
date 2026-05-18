"use client"

import Script from "next/script"

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
const KEY_SET = API_KEY.length > 0 && !API_KEY.startsWith("your_")

export function GoogleMapsScript() {
  if (!KEY_SET) return null
  return (
    <Script
      id="google-maps-api"
      src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`}
      strategy="afterInteractive"
      onLoad={() => window.dispatchEvent(new Event("google-maps-ready"))}
    />
  )
}
