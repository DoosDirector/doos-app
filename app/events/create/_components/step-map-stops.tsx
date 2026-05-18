"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react"
import { MapPin, X, ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlaceSearch } from "@/components/place-search"
import type { PlaceResult } from "@/components/place-search"
import type { CreateEventData } from "./create-event-form"

type Stop = CreateEventData["stops"][number]

const KEY_SET = !!(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length) &&
  !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!.startsWith("your_")
// London city centre default
const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 }

// ── Stop list item ────────────────────────────────────────────────────────────

function StopItem({
  stop, index, total, onRemove, onMoveUp, onMoveDown,
}: {
  stop: Stop; index: number; total: number
  onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{stop.name}</p>
        <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
      </div>
      <div className="flex shrink-0 flex-col">
        <button type="button" onClick={onMoveUp} disabled={index === 0}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Move stop up">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onMoveDown} disabled={index === total - 1}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Move stop down">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <button type="button" onClick={onRemove}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Remove ${stop.name}`}>
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

// ── Live map + autocomplete ───────────────────────────────────────────────────

function MapView({ stops, onAddStop }: { stops: Stop[]; onAddStop: (s: PlaceResult) => void }) {
  const mapEl       = useRef<HTMLDivElement>(null)
  const mapRef      = useRef<any>(null)
  const markersRef  = useRef<any[]>([])
  const dirRenderer = useRef<any>(null)

  // Init map once
  useEffect(() => {
    if (!mapEl.current) return
    const G = (window as any).google.maps
    mapRef.current = new G.Map(mapEl.current, {
      center: DEFAULT_CENTER,
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    })
    dirRenderer.current = new G.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#0d9488", strokeWeight: 4, strokeOpacity: 0.8 },
    })
    dirRenderer.current.setMap(mapRef.current)
  }, [])

  // Sync markers + directions when stops change
  useEffect(() => {
    if (!mapRef.current) return
    const G = (window as any).google.maps
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = stops.map((s, i) =>
      new G.Marker({
        position: { lat: s.lat, lng: s.lng },
        map: mapRef.current,
        label: { text: String(i + 1), color: "white", fontWeight: "bold", fontSize: "11px" },
        icon: { path: G.SymbolPath.CIRCLE, fillColor: "#0d9488", fillOpacity: 1, strokeColor: "white", strokeWeight: 2, scale: 13 },
      })
    )
    if (stops.length >= 2) {
      new G.DirectionsService().route(
        {
          origin: { lat: stops[0].lat, lng: stops[0].lng },
          destination: { lat: stops.at(-1)!.lat, lng: stops.at(-1)!.lng },
          waypoints: stops.slice(1, -1).map((s) => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
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

  function handleSelect(place: PlaceResult) {
    onAddStop(place)
    mapRef.current?.panTo({ lat: place.lat, lng: place.lng })
  }

  return (
    <div className="space-y-3">
      <PlaceSearch onSelect={handleSelect} />
      <div ref={mapEl} className="h-64 w-full overflow-hidden rounded-xl border" role="application" aria-label="Map" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = { data: CreateEventData; onChange: (p: Partial<CreateEventData>) => void }

export function StepMapStops({ data, onChange }: Props) {
  const { stops } = data
  // True immediately if Maps JS API was already loaded (step revisit)
  const [apiLoaded, setApiLoaded] = useState(
    () => typeof window !== "undefined" && !!(window as any).google?.maps
  )

  useEffect(() => {
    if ((window as any).google?.maps) return
    const handler = () => setApiLoaded(true)
    window.addEventListener("google-maps-ready", handler)
    return () => window.removeEventListener("google-maps-ready", handler)
  }, [])

  function setStops(next: Stop[]) { onChange({ stops: next }) }
  function addStop(stop: Stop) {
    if (stops.some((s) => s.placeId === stop.placeId)) return
    setStops([...stops, stop])
  }
  function removeStop(i: number) { setStops(stops.filter((_, idx) => idx !== i)) }
  function moveStop(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= stops.length) return
    const next = [...stops];
    [next[i], next[j]] = [next[j], next[i]]
    setStops(next)
  }

  if (!KEY_SET) {
    return (
      <div className="flex flex-col items-center gap-4 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <MapPin className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium">Google Maps not configured</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Set{" "}
            <code className="rounded bg-muted px-1 font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
            {" "}in <code className="rounded bg-muted px-1 font-mono">.env.local</code> to enable map stops.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold">Map stops</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search for venues to add to your Doo&apos;s route. Stops are connected in order on the map.
          </p>
        </div>

        {apiLoaded ? (
          <MapView stops={stops} onAddStop={addStop} />
        ) : (
          <div className="flex h-64 items-center justify-center gap-2 rounded-xl border bg-muted/30 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading map…
          </div>
        )}

        {stops.length > 0 && (
          <ul className="space-y-2" aria-label="Event stops">
            {stops.map((stop, i) => (
              <StopItem key={stop.placeId} stop={stop} index={i} total={stops.length}
                onRemove={() => removeStop(i)}
                onMoveUp={() => moveStop(i, -1)}
                onMoveDown={() => moveStop(i, 1)}
              />
            ))}
          </ul>
        )}

        {stops.length === 0 && apiLoaded && (
          <p className="text-center text-sm text-muted-foreground">
            No stops yet — search above to add your first venue.
          </p>
        )}
    </div>
  )
}
