"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useTransition } from "react"
import { MapPin, Loader2, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { deleteEventStop, reorderEventStops } from "@/lib/actions/events"
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

  useEffect(() => {
    if (!mapEl.current) return
    const G = (window as any).google.maps
    mapRef.current = new G.Map(mapEl.current, {
      center:            DEFAULT_CENTER,
      zoom:              13,
      mapTypeControl:    false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl:       true,
    })
    dirRenderer.current = new G.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#0d9488", strokeWeight: 4, strokeOpacity: 0.85 },
    })
    dirRenderer.current.setMap(mapRef.current)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    const G = (window as any).google.maps

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    if (stops.length === 0) return

    markersRef.current = stops.map((s, i) =>
      new G.Marker({
        position: { lat: s.lat, lng: s.lng },
        map:      mapRef.current,
        label:    { text: String(i + 1), color: "white", fontWeight: "bold", fontSize: "11px" },
        icon: {
          path: G.SymbolPath.CIRCLE, fillColor: "#0d9488", fillOpacity: 1,
          strokeColor: "white", strokeWeight: 2, scale: 13,
        },
        title: s.name,
      })
    )

    if (stops.length === 1) {
      mapRef.current.setCenter({ lat: stops[0].lat, lng: stops[0].lng })
      mapRef.current.setZoom(15)
    } else {
      const bounds = new G.LatLngBounds()
      stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }))
      mapRef.current.fitBounds(bounds, 40)
    }

    if (stops.length >= 2) {
      new G.DirectionsService().route(
        {
          origin:      { lat: stops[0].lat, lng: stops[0].lng },
          destination: { lat: stops.at(-1)!.lat, lng: stops.at(-1)!.lng },
          waypoints:   stops.slice(1, -1).map((s) => ({
            location: { lat: s.lat, lng: s.lng }, stopover: true,
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

type StopListProps = {
  stops:       Stop[]
  isOrganiser: boolean
  isPending:   boolean
  onRemove:    (id: string) => void
  onMove:      (i: number, dir: -1 | 1) => void
}

function StopList({ stops, isOrganiser, isPending, onRemove, onMove }: StopListProps) {
  return (
    <ol className="space-y-2" aria-label="Route stops">
      {stops.map((stop, i) => (
        <li
          key={stop.id}
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm",
            isPending && "opacity-60"
          )}
        >
          {/* Order badge */}
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {i + 1}
          </span>

          {/* Name + address */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-snug">{stop.name}</p>
            {stop.address && (
              <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
            )}
          </div>

          {/* Organiser controls */}
          {isOrganiser && (
            <>
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => onMove(i, -1)}
                  disabled={i === 0 || isPending}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Move ${stop.name} up`}
                >
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(i, 1)}
                  disabled={i === stops.length - 1 || isPending}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Move ${stop.name} down`}
                >
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onRemove(stop.id)}
                disabled={isPending}
                className={cn(
                  "shrink-0 rounded p-1 text-muted-foreground",
                  "hover:bg-destructive/10 hover:text-destructive",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                aria-label={`Remove stop: ${stop.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </>
          )}
        </li>
      ))}
    </ol>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MapSection({ stops, eventId, isOrganiser }: Props) {
  // Local ordered copy — mutations here instantly sync the map + list
  const [localStops, setLocalStops] = useState(
    () => [...stops].sort((a, b) => a.order - b.order)
  )
  const [isPending, startTransition] = useTransition()

  const [apiLoaded, setApiLoaded] = useState(
    () => typeof window !== "undefined" && !!(window as any).google?.maps
  )

  useEffect(() => {
    if ((window as any).google?.maps) return
    const handler = () => setApiLoaded(true)
    window.addEventListener("google-maps-ready", handler)
    return () => window.removeEventListener("google-maps-ready", handler)
  }, [])

  if (localStops.length === 0) return null

  // ── Organiser actions ──────────────────────────────────────────────────────

  function handleRemove(stopId: string) {
    const previous = localStops
    const next = localStops.filter((s) => s.id !== stopId)
    setLocalStops(next)
    startTransition(async () => {
      const result = await deleteEventStop(stopId, eventId)
      if (result?.error) {
        setLocalStops(previous)
        toast.error("Couldn't remove stop", { description: result.error })
      }
    })
  }

  function handleMove(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= localStops.length) return
    const previous = localStops
    const next = [...localStops];
    [next[i], next[j]] = [next[j], next[i]]
    setLocalStops(next)
    startTransition(async () => {
      const result = await reorderEventStops(eventId, next.map((s) => s.id))
      if (result?.error) {
        setLocalStops(previous)
        toast.error("Couldn't reorder stops", { description: result.error })
      }
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
          <StopList
            stops={localStops} isOrganiser={isOrganiser}
            isPending={isPending} onRemove={handleRemove} onMove={handleMove}
          />
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
          <RouteMap stops={localStops} />
        ) : (
          <div className="flex h-64 items-center justify-center gap-2 rounded-xl border bg-muted/30 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading map…
          </div>
        )}

        <StopList
          stops={localStops} isOrganiser={isOrganiser}
          isPending={isPending} onRemove={handleRemove} onMove={handleMove}
        />
      </div>
    </section>
  )
}
