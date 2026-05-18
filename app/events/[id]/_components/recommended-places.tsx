"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react"
import { Sparkles, Plus, Loader2, Star, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import type { PlaceResult } from "@/components/place-search"

// ── Types ─────────────────────────────────────────────────────────────────────

type NearbyPlace = {
  placeId:  string
  name:     string
  address:  string
  lat:      number
  lng:      number
  rating?:  number
  typeLabel: string
}

type Props = {
  lat:       number
  lng:       number
  apiLoaded: boolean
  onAdd:     (place: PlaceResult) => Promise<void>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_PRIORITY: Record<string, string> = {
  bar:               "Pub / Bar",
  night_club:        "Night club",
  restaurant:        "Restaurant",
  cafe:              "Café",
  bakery:            "Bakery",
  tourist_attraction: "Attraction",
  museum:            "Museum",
  art_gallery:       "Gallery",
  park:              "Park",
  gym:               "Gym",
  bowling_alley:     "Bowling",
  movie_theater:     "Cinema",
  amusement_park:    "Theme park",
  spa:               "Spa",
}

function primaryTypeLabel(types: string[]): string {
  for (const t of types) {
    if (t in TYPE_PRIORITY) return TYPE_PRIORITY[t]
  }
  const first = types[0]
  if (!first || first === "point_of_interest" || first === "establishment") return "Place"
  return first.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function RatingStars({ rating }: { rating: number }) {
  const full    = Math.floor(rating)
  const partial = rating - full
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="text-[11px] font-medium tabular-nums text-amber-600">
        {rating.toFixed(1)}
      </span>
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RecommendedPlaces({ lat, lng, apiLoaded, onAdd }: Props) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [places,  setPlaces]  = useState<NearbyPlace[]>([])
  const [adding,  setAdding]  = useState<string | null>(null)  // placeId being added

  async function fetchSuggestions() {
    if (!apiLoaded) {
      toast.error("Maps not ready", { description: "Please wait a moment and try again." })
      return
    }
    if (places.length > 0) { setOpen(true); return }

    setLoading(true)
    try {
      const G = (window as any).google.maps
      // PlacesService requires a DOM element or Map — use a detached div
      const ghost   = document.createElement("div")
      const service = new G.places.PlacesService(ghost)

      await new Promise<void>((resolve) => {
        service.nearbySearch(
          {
            location: new G.LatLng(lat, lng),
            radius:   1000,
            rankBy:   G.places.RankBy.PROMINENCE,
          },
          (results: any[], status: string) => {
            if (status !== G.places.PlacesServiceStatus.OK || !results) {
              resolve()
              return
            }
            const mapped: NearbyPlace[] = results
              .filter((r: any) => r.geometry?.location && r.name)
              .slice(0, 6)
              .map((r: any) => ({
                placeId:   r.place_id,
                name:      r.name,
                address:   r.vicinity ?? "",
                lat:       r.geometry.location.lat(),
                lng:       r.geometry.location.lng(),
                rating:    r.rating,
                typeLabel: primaryTypeLabel(r.types ?? []),
              }))
            setPlaces(mapped)
            resolve()
          },
        )
      })
    } catch {
      toast.error("Couldn't load suggestions")
    } finally {
      setLoading(false)
      setOpen(true)
    }
  }

  async function handleAdd(place: NearbyPlace) {
    setAdding(place.placeId)
    try {
      await onAdd({
        placeId: place.placeId,
        name:    place.name,
        address: place.address,
        lat:     place.lat,
        lng:     place.lng,
      })
      // Remove from suggestions once added
      setPlaces((prev) => prev.filter((p) => p.placeId !== place.placeId))
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : fetchSuggestions())}
        disabled={loading}
        className="flex w-full items-center justify-between rounded-xl border border-dashed px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            : <Sparkles className="h-4 w-4"              aria-hidden="true" />}
          {loading ? "Finding nearby places…" : "Suggest nearby places"}
        </span>
        {!loading && (open
          ? <ChevronUp   className="h-4 w-4" aria-hidden="true" />
          : <ChevronDown className="h-4 w-4" aria-hidden="true" />)}
      </button>

      {/* Suggestions list */}
      {open && places.length > 0 && (
        <ul className="space-y-1.5" aria-label="Nearby place suggestions" role="list">
          {places.map((place) => (
            <li
              key={place.placeId}
              role="listitem"
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm font-medium leading-snug">{place.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{place.typeLabel}</span>
                  {place.rating && (
                    <>
                      <span className="text-[10px] text-muted-foreground/40">·</span>
                      <RatingStars rating={place.rating} />
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAdd(place)}
                disabled={adding === place.placeId}
                aria-label={`Add ${place.name} to stops`}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                {adding === place.placeId
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  : <Plus    className="h-3.5 w-3.5"              aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && places.length === 0 && !loading && (
        <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No suggestions found nearby.
        </p>
      )}
    </div>
  )
}
