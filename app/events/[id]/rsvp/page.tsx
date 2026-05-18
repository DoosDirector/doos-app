import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ChevronLeft } from "lucide-react"
import { requireUser }  from "@/lib/auth/guard"
import { createClient } from "@/lib/supabase/server"
import { RsvpForm }     from "./_components/rsvp-form"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `RSVP — ${id}` }
}

export default async function RsvpPage({ params }: Props) {
  const [{ id }, user] = await Promise.all([params, requireUser()])

  const supabase = await createClient()

  // Fetch event (title + alcohol flag) and current user's RSVP in parallel
  const [eventResult, rsvpResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, alcohol_friendly")
      .eq("id", id)
      .single(),
    supabase
      .from("rsvps")
      .select("status, drinking_preference")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  if (eventResult.error && eventResult.error.code !== "PGRST116") throw new Error(eventResult.error.message)
  if (rsvpResult.error) throw new Error(rsvpResult.error.message)

  const event       = eventResult.data
  const existingRsvp = rsvpResult.data

  if (!event) notFound()

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-6">
      {/* Back link */}
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to event
      </Link>

      {/* Heading */}
      <div>
        <h1 className="text-xl font-bold">RSVP</h1>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{event.title}</p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border bg-card p-5">
        <RsvpForm
          eventId={event.id}
          alcoholFriendly={event.alcohol_friendly ?? false}
          initialStatus={existingRsvp?.status}
          initialDrinking={existingRsvp?.drinking_preference}
        />
      </div>
    </div>
  )
}
