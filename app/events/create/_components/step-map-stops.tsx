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
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white"
        aria-hidden="true"
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-snug">{stop.name}</p>
        {stop.address && (
          <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col">
        <button
          type="button" onClick={onMoveUp} disabled={index === 0}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Move ${stop.name} up`}
        >
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button" onClick={onMoveDown} disabled={index === total - 1}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Move ${stop.name} down`}
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button" onClick={onRemove}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Remove ${stop.name}`}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </li>
  )
}

// ── Live map + autocomplete ───────────────────────────────────────────────────

const POLY_OPTS = { strokeColor: "#0d9488", strokeWeight: 4, strokeOpacity: 0.85 }

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function infoContent(num: number, name: string, address: string) {
  return `<div style="max-width:200px;font-family:inherit">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:${address ? 4 : 0}px">
      <span style="flex-shrink:0;display:flex;width:18px;height:18px;border-radius:50%;background:#0d9488;color:#fff;font-size:10px;font-weight:700;align-items:center;justify-content:center">${num}</span>
      <strong style="font-size:13px;line-height:1.3">${esc(name)}</strong>
    </div>
    ${address ? `<p style="margin:0;font-size:11px;color:#6b7280;line-height:1.4">${esc(address)}</p>` : ""}
  </div>`
}

function MapView({ stops, onAddStop }: { stops: Stop[]; onAddStop: (s: PlaceResult) => void }) {
  const mapEl           = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const markersRef      = useRef<any[]>([])
  const dirRenderer     = useRef<any>(null)
  const fallbackPolyRef = useRef<any>(null)
  const infoWindowRef   = useRef<any>(null)

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
      polylineOptions: POLY_OPTS,
    })
    dirRenderer.current.setMap(mapRef.current)

    infoWindowRef.current = new G.InfoWindow()
    mapRef.current.addListener("click", () => infoWindowRef.current?.close())
  }, [])

  // Sync markers + route when stops change
  useEffect(() => {
    if (!mapRef.current) return
    const G = (window as any).google.maps

    // ── Clear previous state ─────────────────────────────────────────────
    infoWindowRef.current?.close()
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    dirRenderer.current?.setMap(null)
    dirRenderer.current?.setMap(mapRef.current)
    fallbackPolyRef.current?.setMap(null)
    fallbackPolyRef.current = null

    if (stops.length === 0) return

    // ── Numbered teal markers with click → InfoWindow ────────────────────
    markersRef.current = stops.map((s, i) => {
      const marker = new G.Marker({
        position: { lat: s.lat, lng: s.lng },
        map: mapRef.current,
        label: { text: String(i + 1), color: "white", fontWeight: "bold", fontSize: "11px" },
        icon: { path: G.SymbolPath.CIRCLE, fillColor: "#0d9488", fillOpacity: 1, strokeColor: "white", strokeWeight: 2, scale: 13 },
        title: s.name,
      })
      marker.addListener("click", () => {
        infoWindowRef.current.setContent(infoContent(i + 1, s.name, s.address))
        infoWindowRef.current.open({ anchor: marker, map: mapRef.current })
      })
      return marker
    })

    // ── Route polyline ───────────────────────────────────────────────────
    if (stops.length >= 2) {
      new G.DirectionsService().route(
        {
          origin: { lat: stops[0].lat, lng: stops[0].lng },
          destination: { lat: stops.at(-1)!.lat, lng: stops.at(-1)!.lng },
          waypoints: stops.slice(1, -1).map((s) => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
          travelMode: G.TravelMode.WALKING,
        },
        (result: any, status: string) => {
          if (status === "OK") {
            dirRenderer.current?.setDirections(result)
          } else {
            // Fallback: dashed straight-line polyline when no walkable route exists
            fallbackPolyRef.current = new G.Polyline({
              path:          stops.map((s) => ({ lat: s.lat, lng: s.lng })),
              strokeColor:   POLY_OPTS.strokeColor,
              strokeWeight:  POLY_OPTS.strokeWeight,
              strokeOpacity: 0,
              icons: [{
                icon:   { path: "M 0,-1 0,1", strokeOpacity: 0.7, scale: 3 },
                offset: "0",
                repeat: "14px",
              }],
              map: mapRef.current,
            })
          }
        }
      )
    }
  }, [stops])

  function handleSelect(place: PlaceResult) {
    onAddStop(place)
    mapRef.current?.panTo({ lat: place.lat, lng: place.lng })
  }

  return (
    <div className="space-y-3">
      <PlaceSearch onSelect={handleSelect} />
      <div ref={mapEl} className="h-52 w-full overflow-hidden rounded-xl border sm:h-64" role="application" aria-label="Map" />
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
          <div className="flex h-52 items-center justify-center gap-2 rounded-xl border bg-muted/30 text-sm text-muted-foreground sm:h-64">
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
