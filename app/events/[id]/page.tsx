import { cache }    from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { requireUser }    from "@/lib/auth/guard"
import { createClient }   from "@/lib/supabase/server"
import { EventHeader }    from "./_components/event-header"
import { RsvpStrip }      from "./_components/rsvp-strip"
import { PollSection }    from "./_components/poll-section"
import { MapSection }     from "./_components/map-section"
import { AttendeeList }   from "./_components/attendee-list"
import { MemoryPreview }  from "./_components/memory-preview"
import { ShareButton }    from "./_components/share-button"
import { CreatedToast }   from "./_components/created-toast"

// ── Cached data fetcher (shared between generateMetadata + page) ──────────────

const fetchEvent = cache(async (id: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select(`
      id, title, description, type, date, alcohol_friendly, share_token,
      organiser_id, created_at,
      organiser:profiles!events_organiser_id_fkey(id, display_name, avatar_url),
      rsvps(id, status, drinking_preference, user_id, profiles(display_name, avatar_url)),
      poll_questions(id, question_text, question_type,
        poll_options(id, option_text,
          poll_votes(id, user_id)
        )
      ),
      event_stops(id, name, address, lat, lng, "order"),
      memories(id, storage_path, media_type, caption, created_at)
    `)
    .eq("id", id)
    .single()
  return data
})

// ── Metadata ──────────────────────────────────────────────────────────────────

type Props = {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }  = await params
  const event   = await fetchEvent(id)
  if (!event) return { title: "Event" }

  const description = buildDescription(event)
  const shareUrl    = `/e/${event.share_token}`

  const ogImage = `/api/og/event/${id}`

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EventPage({ params, searchParams }: Props) {
  const [{ id }, sp, user] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ])

  const event = await fetchEvent(id)
  if (!event) notFound()

  const justCreated = sp.created === "1"

  // Normalise nested arrays (Supabase may return null for empty relations)
  const organiser     = Array.isArray(event.organiser)     ? event.organiser[0]     ?? null : event.organiser
  const rsvps         = event.rsvps         ?? []
  const pollQuestions = event.poll_questions ?? []
  const stops         = event.event_stops   ?? []
  const memories      = (event.memories     ?? []).sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {justCreated && <CreatedToast />}

      {/* Header */}
      <EventHeader
        event={event}
        organiser={organiser}
        currentUserId={user.id}
      />

      {/* Share */}
      <div className="flex justify-end">
        <ShareButton shareToken={event.share_token} />
      </div>

      {/* RSVP strip */}
      <RsvpStrip
        rsvps={rsvps}
        eventId={event.id}
        currentUserId={user.id}
        isAlcoholFriendly={event.alcohol_friendly ?? false}
      />

      {/* Attendee list */}
      <AttendeeList
        rsvps={rsvps}
        eventId={event.id}
        organiserId={event.organiser_id}
        currentUserId={user.id}
        isAlcoholFriendly={event.alcohol_friendly ?? false}
      />

      {/* Polls */}
      <PollSection questions={pollQuestions} currentUserId={user.id} />

      {/* Map route */}
      <MapSection
        stops={stops}
        eventId={event.id}
        isOrganiser={event.organiser_id === user.id}
      />

      {/* Memory box */}
      <MemoryPreview memories={memories} eventId={event.id} />
    </div>
  )
}
