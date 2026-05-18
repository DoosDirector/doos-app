"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react"
import { Sparkles, Plus, Loader2, Star, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { PlaceResult } from "@/components/place-search"

// ── Types ─────────────────────────────────────────────────────────────────────

type NearbyPlace = {
  placeId:   string
  name:      string
  address:   string
  lat:       number
  lng:       number
  rating?:   number
  userRatingsTotal?: number
  typeLabel: string
}

type Props = {
  lat:       number
  lng:       number
  apiLoaded: boolean
  onAdd:     (place: PlaceResult) => Promise<void>
}

// ── Type label map ────────────────────────────────────────────────────────────

const TYPE_PRIORITY: Record<string, string> = {
  bar:                "Pub / Bar",
  night_club:         "Night club",
  restaurant:         "Restaurant",
  cafe:               "Café",
  bakery:             "Bakery",
  tourist_attraction: "Attraction",
  museum:             "Museum",
  art_gallery:        "Gallery",
  park:               "Park",
  gym:                "Gym",
  bowling_alley:      "Bowling",
  movie_theater:      "Cinema",
  amusement_park:     "Theme park",
  spa:                "Spa",
  stadium:            "Stadium",
  zoo:                "Zoo",
  aquarium:           "Aquarium",
}

function primaryTypeLabel(types: string[]): string {
  for (const t of types) {
    if (t in TYPE_PRIORITY) return TYPE_PRIORITY[t]
  }
  const first = types.find((t) => t !== "point_of_interest" && t !== "establishment")
  if (!first) return "Place"
  return first.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {label}
    </span>
  )
}

function RatingPill({ rating, total }: { rating: number; total?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Rated ${rating.toFixed(1)} out of 5${total ? `, ${total} reviews` : ""}`}
    >
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="text-[11px] font-medium tabular-nums text-amber-600">
        {rating.toFixed(1)}
      </span>
      {total && total > 0 && (
        <span className="text-[10px] text-muted-foreground/60">({total.toLocaleString()})</span>
      )}
    </span>
  )
}

function PlaceCard({
  place,
  onAdd,
  isAdding,
}: {
  place:    NearbyPlace
  onAdd:    () => void
  isAdding: boolean
}) {
  return (
    <li
      role="listitem"
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/30"
    >
      {/* Info */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium leading-snug">{place.name}</p>

        {/* Address */}
        {place.address && (
          <p className="truncate text-[11px] text-muted-foreground/70">{place.address}</p>
        )}

        {/* Type + rating row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeBadge label={place.typeLabel} />
          {place.rating != null && (
            <RatingPill rating={place.rating} total={place.userRatingsTotal} />
          )}
        </div>
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={onAdd}
        disabled={isAdding}
        aria-label={`Add ${place.name} to stops`}
        className={cn(
          "shrink-0 flex h-9 w-9 items-center justify-center rounded-xl",
          "bg-brand-primary text-white transition-colors",
          "hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {isAdding
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          : <Plus    className="h-4 w-4"              aria-hidden="true" />}
      </button>
    </li>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RecommendedPlaces({ lat, lng, apiLoaded, onAdd }: Props) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [places,  setPlaces]  = useState<NearbyPlace[]>([])
  const [empty,   setEmpty]   = useState(false)
  const [adding,  setAdding]  = useState<string | null>(null)

  async function fetchSuggestions(force = false) {
    if (!apiLoaded) {
      toast.error("Maps not ready", { description: "Please wait a moment and try again." })
      return
    }
    if (places.length > 0 && !force) { setOpen(true); return }

    setLoading(true)
    setEmpty(false)

    try {
      const G       = (window as any).google.maps
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
            if (status !== G.places.PlacesServiceStatus.OK || !results?.length) {
              setEmpty(true)
              resolve()
              return
            }

            const mapped: NearbyPlace[] = results
              .filter((r: any) => r.geometry?.location && r.name)
              .slice(0, 5)                           // cap at 5
              .map((r: any) => ({
                placeId:          r.place_id,
                name:             r.name,
                address:          r.vicinity ?? "",
                lat:              r.geometry.location.lat(),
                lng:              r.geometry.location.lng(),
                rating:           r.rating,
                userRatingsTotal: r.user_ratings_total,
                typeLabel:        primaryTypeLabel(r.types ?? []),
              }))

            setPlaces(mapped)
            if (mapped.length === 0) setEmpty(true)
            resolve()
          },
        )
      })
    } catch {
      toast.error("Couldn't load suggestions", { description: "Check your connection and try again." })
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
      setPlaces((prev) => prev.filter((p) => p.placeId !== place.placeId))
    } finally {
      setAdding(null)
    }
  }

  const hasResults = places.length > 0

  return (
    <div className="space-y-2">
      {/* ── Toggle / trigger button ─────────────────────────────────── */}
      <button
        type="button"
        onClick={() => open ? setOpen(false) : fetchSuggestions()}
        disabled={loading}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-dashed px-4 py-2.5",
          "text-sm font-medium text-muted-foreground transition-colors",
          "hover:border-brand-primary hover:text-brand-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {loading
            ? <Loader2  className="h-4 w-4 animate-spin" aria-hidden="true" />
            : <Sparkles className="h-4 w-4"              aria-hidden="true" />}
          {loading ? "Finding nearby places…" : "Suggest nearby places"}
        </span>
        {!loading && (
          open
            ? <ChevronUp   className="h-4 w-4" aria-hidden="true" />
            : <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {/* ── Results panel ───────────────────────────────────────────── */}
      {open && (
        <>
          {hasResults ? (
            <ul className="space-y-1.5" aria-label="Nearby place suggestions" role="list">
              {places.map((place) => (
                <PlaceCard
                  key={place.placeId}
                  place={place}
                  onAdd={() => handleAdd(place)}
                  isAdding={adding === place.placeId}
                />
              ))}
            </ul>
          ) : (
            /* Empty / no results */
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">No suggestions found nearby.</p>
              <button
                type="button"
                onClick={() => fetchSuggestions(true)}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:underline disabled:opacity-60"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Retry
              </button>
            </div>
          )}

          {/* All suggestions added */}
          {hasResults && places.length === 0 && !empty && (
            <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              All suggestions added to your route.
            </p>
          )}
        </>
      )}
    </div>
  )
}
