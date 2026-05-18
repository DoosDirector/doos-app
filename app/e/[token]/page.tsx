import { cache }    from "react"
import { notFound } from "next/navigation"
import Link          from "next/link"
import type { Metadata } from "next"
import {
  MapPin, Users, BarChart2,
  LogIn, ArrowRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser }      from "@/lib/auth/guard"
import { EventHeader }  from "@/app/events/[id]/_components/event-header"
import { MemoryPreview } from "@/app/events/[id]/_components/memory-preview"

// ── Cached fetcher ────────────────────────────────────────────────────────────

const fetchEventByToken = cache(async (token: string) => {
  const supabase = await createClient(true) // service role — no RLS needed for public preview
  const { data } = await supabase
    .from("events")
    .select(`
      id, title, description, type, date, alcohol_friendly, share_token,
      organiser_id, created_at,
      organiser:profiles!events_organiser_id_fkey(id, display_name, avatar_url),
      rsvps(id, status),
      poll_questions(id, question_text,
        poll_options(id, option_text,
          poll_votes(id)
        )
      ),
      event_stops(id, name, address, "order"),
      memories(id, storage_path, media_type, caption, created_at)
    `)
    .eq("share_token", token)
    .single()
  return data
})

// ── Metadata ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABEL: Record<string, string> = {
  night_out:     "Night out",
  lunch:         "Lunch",
  coffee:        "Coffee",
  team_building: "Team building",
  activity:      "Activity",
  other:         "Event",
}

function buildDescription(event: { title: string; description: string | null; type: string; date: string | null }): string {
  if (event.description) return event.description
  const typeLabel = EVENT_TYPE_LABEL[event.type] ?? "Event"
  if (event.date) {
    const formatted = new Date(event.date).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
    })
    return `${typeLabel} on ${formatted} — join on Doo's.`
  }
  return `${typeLabel} — join on Doo's.`
}

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const event     = await fetchEventByToken(token)
  if (!event) return { title: "Event not found" }

  const description = buildDescription(event)
  const shareUrl    = `/e/${token}`

  const ogImage = `/api/og/event/${event.id}`

  return {
    title:       event.title,
    description,
    openGraph: {
      title:       event.title,
      description,
      url:         shareUrl,
      type:        "website",
      images:      [{ url: ogImage, width: 1200, height: 630, alt: event.title }],
    },
    twitter: {
      card:        "summary_large_image",
      title:       event.title,
      description,
      images:      [ogImage],
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rsvpCounts(rsvps: { status: string }[]) {
  return {
    going: rsvps.filter((r) => r.status === "yes").length,
    maybe: rsvps.filter((r) => r.status === "maybe").length,
    no:    rsvps.filter((r) => r.status === "no").length,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RsvpSummary({ rsvps }: { rsvps: { status: string }[] }) {
  const counts = rsvpCounts(rsvps)
  const total  = rsvps.length
  if (total === 0) return null

  return (
    <section aria-labelledby="rsvp-summary-heading" className="space-y-2">
      <h2
        id="rsvp-summary-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Who's coming
      </h2>
      <div className="flex gap-4 rounded-xl border bg-card p-4">
        <StatPill value={counts.going} label="Going"    colour="text-green-600" />
        <StatPill value={counts.maybe} label="Maybe"    colour="text-amber-600" />
        <StatPill value={counts.no}    label="Can't make it" colour="text-red-500" />
      </div>
    </section>
  )
}

function StatPill({ value, label, colour }: { value: number; label: string; colour: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[56px]">
      <span className={`text-2xl font-bold tabular-nums ${colour}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

type PollQuestion = {
  id: string
  question_text: string
  poll_options: { id: string; option_text: string; poll_votes: { id: string }[] }[]
}

function PollPreview({ questions }: { questions: PollQuestion[] }) {
  if (questions.length === 0) return null

  return (
    <section aria-labelledby="polls-heading" className="space-y-3">
      <h2
        id="polls-heading"
        className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
        Polls
      </h2>
      <div className="space-y-4">
        {questions.map((q) => {
          const total = q.poll_options.reduce((sum, o) => sum + o.poll_votes.length, 0)
          return (
            <div key={q.id} className="rounded-xl border bg-card p-4 space-y-3">
              <p className="text-sm font-medium">{q.question_text}</p>
              <div className="space-y-2">
                {q.poll_options.map((opt) => {
                  const votes = opt.poll_votes.length
                  const pct   = total === 0 ? 0 : Math.round((votes / total) * 100)
                  return (
                    <div key={opt.id} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground/80">{opt.option_text}</span>
                        <span className="tabular-nums text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-brand-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {total > 0 && (
                <p className="text-[11px] text-muted-foreground">{total} {total === 1 ? "vote" : "votes"}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

type Stop = { id: string; name: string; address: string; order: number }

function StopList({ stops }: { stops: Stop[] }) {
  if (stops.length === 0) return null
  const sorted = [...stops].sort((a, b) => a.order - b.order)

  return (
    <section aria-labelledby="stops-heading" className="space-y-2">
      <h2
        id="stops-heading"
        className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        The route
      </h2>
      <ol className="space-y-2">
        {sorted.map((stop, i) => (
          <li key={stop.id} className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug truncate">{stop.name}</p>
              {stop.address && (
                <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function JoinCta({ eventId, isLoggedIn }: { eventId: string; isLoggedIn: boolean }) {
  const href = isLoggedIn
    ? `/events/${eventId}`
    : `/auth/sign-in?redirect=/events/${eventId}`

  return (
    <div className="sticky bottom-4 z-10">
      <Link
        href={href}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary px-6 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {isLoggedIn
          ? <><ArrowRight className="h-5 w-5" aria-hidden="true" /> RSVP to this Doo</>
          : <><LogIn      className="h-5 w-5" aria-hidden="true" /> Sign in to RSVP</>
        }
      </Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PublicEventPage({ params }: Props) {
  const [{ token }, user] = await Promise.all([params, getUser()])

  const event = await fetchEventByToken(token)
  if (!event) notFound()

  const organiser     = Array.isArray(event.organiser) ? event.organiser[0] ?? null : event.organiser
  const rsvps         = event.rsvps         ?? []
  const pollQuestions = event.poll_questions ?? []
  const stops         = (event.event_stops  ?? []) as Stop[]
  const memories      = (event.memories     ?? []).sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-24">
      {/* Pill banner */}
      <div className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground w-fit">
        <Users className="h-3 w-3" aria-hidden="true" />
        You've been invited
      </div>

      {/* Event header (read-only) */}
      <EventHeader
        event={event}
        organiser={organiser}
        currentUserId={user?.id ?? ""}
      />

      {/* RSVP summary */}
      <RsvpSummary rsvps={rsvps} />

      {/* Poll results */}
      <PollPreview questions={pollQuestions as PollQuestion[]} />

      {/* Route stops */}
      <StopList stops={stops} />

      {/* Memory box preview */}
      {memories.length > 0 && (
        <MemoryPreview memories={memories} eventId={event.id} />
      )}

      {/* Sticky CTA */}
      <JoinCta eventId={event.id} isLoggedIn={!!user} />
    </div>
  )
}
