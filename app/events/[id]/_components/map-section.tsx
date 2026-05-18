"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react"
import { MapPin, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Tables } from "@/types"

type Stop = Pick<Tables<"event_stops">, "id" | "name" | "address" | "lat" | "lng" | "order">

type Props = {
  stops:       Stop[]
  eventId:     string
  isOrganiser: boolean
}

const KEY_SET = !!(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length) &&
  !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!.startsWith("your_")
const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 } // London

// ── Read-only map view ────────────────────────────────────────────────────────

function RouteMap({ stops }: { stops: Stop[] }) {
  const mapEl       = useRef<HTMLDivElement>(null)
  const mapRef      = useRef<any>(null)
  const markersRef  = useRef<any[]>([])
  const dirRenderer = useRef<any>(null)

  // Init map + directions renderer once
  useEffect(() => {
    if (!mapEl.current) return
    const G = (window as any).google.maps

    mapRef.current = new G.Map(mapEl.current, {
      center:              DEFAULT_CENTER,
      zoom:                13,
      mapTypeControl:      false,
      fullscreenControl:   false,
      streetViewControl:   false,
      zoomControl:         true,
    })

    dirRenderer.current = new G.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#0d9488", strokeWeight: 4, strokeOpacity: 0.85 },
    })
    dirRenderer.current.setMap(mapRef.current)
  }, [])

  // Sync markers + route when stops change (also runs on first paint)
  useEffect(() => {
    if (!mapRef.current) return
    const G = (window as any).google.maps

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    if (stops.length === 0) return

    // Place numbered teal markers
    markersRef.current = stops.map((s, i) =>
      new G.Marker({
        position: { lat: s.lat, lng: s.lng },
        map: mapRef.current,
        label: { text: String(i + 1), color: "white", fontWeight: "bold", fontSize: "11px" },
        icon: {
          path:         G.SymbolPath.CIRCLE,
          fillColor:    "#0d9488",
          fillOpacity:  1,
          strokeColor:  "white",
          strokeWeight: 2,
          scale:        13,
        },
        title: s.name,
      })
    )

    // Fit map bounds to all stops
    if (stops.length === 1) {
      mapRef.current.setCenter({ lat: stops[0].lat, lng: stops[0].lng })
      mapRef.current.setZoom(15)
    } else {
      const bounds = new G.LatLngBounds()
      stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }))
      mapRef.current.fitBounds(bounds, /* padding px */ 40)
    }

    // Draw walking route polyline connecting stops in order
    if (stops.length >= 2) {
      new G.DirectionsService().route(
        {
          origin:      { lat: stops[0].lat, lng: stops[0].lng },
          destination: { lat: stops.at(-1)!.lat, lng: stops.at(-1)!.lng },
          waypoints:   stops.slice(1, -1).map((s) => ({
            location: { lat: s.lat, lng: s.lng },
            stopover: true,
          })),
          travelMode: G.TravelMode.WALKING,
        },
        (result: any, status: string) => {
          if (status === "OK") dirRenderer.current.setDirections(result)
        }
      )
    } else {
      dirRenderer.current?.setDirections({ routes: [] })
    }
  }, [stops])

  return (
    <div
      ref={mapEl}
      className="h-64 w-full overflow-hidden rounded-xl border"
      role="application"
      aria-label="Event route map"
    />
  )
}

// ── Stop list ─────────────────────────────────────────────────────────────────

function StopList({ stops, isOrganiser, eventId }: { stops: Stop[]; isOrganiser: boolean; eventId: string }) {
  function handleRemove(stop: Stop) {
    // TODO (Task 51+): call deleteStop(stop.id, eventId) server action
    toast.info("Stop management coming soon", {
      description: "Organisers will be able to edit stops in an upcoming update.",
    })
  }

  return (
    <ol className="space-y-2" aria-label="Route stops">
      {stops.map((stop, i) => (
        <li key={stop.id} className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{stop.name}</p>
            {stop.address && (
              <p className="text-xs text-muted-foreground">{stop.address}</p>
            )}
          </div>
          {isOrganiser && (
            <button
              type="button"
              onClick={() => handleRemove(stop)}
              className={cn(
                "mt-0.5 shrink-0 rounded p-1 text-muted-foreground",
                "hover:bg-destructive/10 hover:text-destructive",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label={`Remove stop: ${stop.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ol>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MapSection({ stops, eventId, isOrganiser }: Props) {
  const sorted = [...stops].sort((a, b) => a.order - b.order)

  const [apiLoaded, setApiLoaded] = useState(
    () => typeof window !== "undefined" && !!(window as any).google?.maps
  )

  useEffect(() => {
    if ((window as any).google?.maps) return
    const handler = () => setApiLoaded(true)
    window.addEventListener("google-maps-ready", handler)
    return () => window.removeEventListener("google-maps-ready", handler)
  }, [])

  if (sorted.length === 0) return null

  if (!KEY_SET) {
    return (
      <section aria-labelledby="route-heading" className="space-y-3">
        <h2 id="route-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          The route
        </h2>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex h-36 items-center justify-center gap-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Map unavailable — Google Maps API key not configured
          </div>
          <StopList stops={sorted} isOrganiser={isOrganiser} eventId={eventId} />
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="route-heading" className="space-y-3">
        <h2 id="route-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          The route
        </h2>

        <div className="rounded-xl border bg-card p-4 space-y-4">
          {apiLoaded ? (
            <RouteMap stops={sorted} />
          ) : (
            <div className="flex h-64 items-center justify-center gap-2 rounded-xl border bg-muted/30 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading map…
            </div>
          )}

          <StopList stops={sorted} isOrganiser={isOrganiser} eventId={eventId} />
        </div>
    </section>
  )
}
