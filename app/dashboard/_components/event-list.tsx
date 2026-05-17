import { CalendarDays } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/guard"
import { EventCard } from "@/components/event-card"
import { EmptyState } from "@/components/empty-state"

// ── Event list (async server component used inside Suspense) ──────────────────

export async function EventList() {
  await requireUser()
  const supabase = await createClient()

  const { data: events, error } = await supabase
    .from("events")
    .select("*, rsvp_count:rsvps(count)")
    .order("date", { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)

  const eventsWithCount = (events ?? []).map((e) => ({
    ...e,
    rsvp_count: Array.isArray(e.rsvp_count) ? (e.rsvp_count[0]?.count ?? 0) : 0,
  }))

  if (eventsWithCount.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        heading="No Doos yet"
        description="Create your first Doo and invite your team to vote, RSVP, and share memories."
        action={{ label: "Create your first Doo", href: "/events/create" }}
      />
    )
  }

  const now = new Date()
  const upcoming = eventsWithCount.filter((e) => !e.date || new Date(e.date) >= now)
  const past     = eventsWithCount.filter((e) =>  e.date && new Date(e.date) <  now)

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
          <ul className="space-y-3">
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
