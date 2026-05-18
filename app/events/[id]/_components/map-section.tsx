import { MapPin } from "lucide-react"
import type { Tables } from "@/types"

type Stop = Pick<Tables<"event_stops">, "id" | "name" | "address" | "order">

type Props = { stops: Stop[] }

export function MapSection({ stops }: Props) {
  if (stops.length === 0) return null

  const sorted = [...stops].sort((a, b) => a.order - b.order)

  return (
    <section aria-labelledby="stops-heading" className="space-y-3">
      <h2 id="stops-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        The route
      </h2>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        {/* Map placeholder — embedded map built in Task 48 */}
        <div className="flex h-36 items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground gap-2">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Interactive map coming soon
        </div>

        <ol className="space-y-2">
          {sorted.map((stop, i) => (
            <li key={stop.id} className="flex items-start gap-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{stop.name}</p>
                {stop.address && (
                  <p className="text-xs text-muted-foreground">{stop.address}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
