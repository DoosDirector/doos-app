import Link from "next/link"
import { CalendarDays, Wine, WineOff, Users, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/guard"
import { Button } from "@/components/ui/button"
import type { Event } from "@/types"

// ── Placeholder EventCard (replaced in Task 33) ───────────────────────────────

const EVENT_TYPE_LABELS: Record<Event["type"], string> = {
  night_out:     "Night out",
  lunch:         "Lunch",
  coffee:        "Coffee",
  team_building: "Team building",
  activity:      "Activity",
  other:         "Event",
}

function EventCard({ event }: { event: Event & { rsvp_count: number } }) {
  const dateLabel = event.date
    ? new Date(event.date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date TBC"

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Type badge */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
        <span className="text-xs font-semibold">
          {EVENT_TYPE_LABELS[event.type].slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-foreground group-hover:text-brand-primary">
            {event.title}
          </h3>
          {event.alcohol_friendly ? (
            <Wine className="h-3.5 w-3.5 shrink-0 text-brand-accent" aria-label="Alcohol friendly" />
          ) : (
            <WineOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="No alcohol" />
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {dateLabel}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" />
            {event.rsvp_count} going
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
        <CalendarDays className="h-8 w-8 text-brand-primary" aria-hidden="true" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">No events yet</h2>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground">
        Create your first Doo and invite your team to vote, RSVP, and share memories.
      </p>
      <Button asChild>
        <Link href="/events/create">Create your first Doo</Link>
      </Button>
    </div>
  )
}

// ── Event list (async server component, used inside Suspense) ─────────────────

export async function EventList() {
  const user = await requireUser()
  const supabase = await createClient()

  // Fetch events the user belongs to + RSVP count per event
  const { data: events, error } = await supabase
    .from("events")
    .select(`
      *,
      rsvp_count:rsvps(count)
    `)
    .order("date", { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)

  // Flatten the aggregated count Supabase returns as [{ count: n }]
  const eventsWithCount = (events ?? []).map((e) => ({
    ...e,
    rsvp_count: Array.isArray(e.rsvp_count) ? (e.rsvp_count[0]?.count ?? 0) : 0,
  }))

  if (eventsWithCount.length === 0) return <EmptyState />

  // Split into upcoming and past
  const now = new Date()
  const upcoming = eventsWithCount.filter(
    (e) => !e.date || new Date(e.date) >= now
  )
  const past = eventsWithCount.filter(
    (e) => e.date && new Date(e.date) < now
  )

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming
          </h2>
          <ul className="space-y-3">
            {upcoming.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Past events
          </h2>
          <ul className="space-y-3 opacity-60">
            {past.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
