"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlaceResult = {
  placeId: string
  name:    string
  address: string
  lat:     number
  lng:     number
}

type Props = {
  onSelect:    (place: PlaceResult) => void
  placeholder?: string
  className?:  string
  disabled?:   boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlaceSearch({ onSelect, placeholder = "Search for a venue or place…", className, disabled }: Props) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const acRef       = useRef<any>(null)
  const callbackRef = useRef(onSelect)
  useEffect(() => { callbackRef.current = onSelect })

  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && !!(window as any).google?.maps?.places
  )

  // Wait for the global Maps script if not yet ready
  useEffect(() => {
    if (ready) return
    const handler = () => setReady(true)
    window.addEventListener("google-maps-ready", handler)
    return () => window.removeEventListener("google-maps-ready", handler)
  }, [ready])

  // Init Autocomplete once the API is ready and the input is mounted
  useEffect(() => {
    if (!ready || !inputRef.current || acRef.current) return
    const G  = (window as any).google.maps
    const ac = new G.places.Autocomplete(inputRef.current, {
      fields: ["place_id", "name", "geometry", "formatted_address"],
    })
    ac.addListener("place_changed", () => {
      const place = ac.getPlace()
      if (!place.geometry?.location) return
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      callbackRef.current({
        placeId: place.place_id      ?? "",
        name:    place.name          ?? "",
        address: place.formatted_address ?? "",
        lat,
        lng,
      })
      if (inputRef.current) inputRef.current.value = ""
    })
    acRef.current = ac
    return () => {
      if (acRef.current) {
        G.event.clearInstanceListeners(acRef.current)
        acRef.current = null
      }
    }
  }, [ready])

  return (
    <div className={cn("relative", className)}>
      {ready ? (
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      ) : (
        <Loader2
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      )}
      <Input
        ref={inputRef}
        placeholder={ready ? placeholder : "Loading map…"}
        disabled={disabled || !ready}
        className="pl-9"
        aria-label="Search for a place"
        autoComplete="off"
      />
    </div>
  )
}
