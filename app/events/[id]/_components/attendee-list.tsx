"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, Wine, CupSoda, HelpCircle, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tables, Enums } from "@/types"

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = Pick<Tables<"profiles">, "display_name" | "avatar_url">

type Rsvp = Pick<Tables<"rsvps">, "id" | "status" | "drinking_preference" | "user_id"> & {
  profiles: Profile | null
}

type Props = {
  rsvps:             Rsvp[]
  eventId:           string
  organiserId:       string
  currentUserId:     string
  isAlcoholFriendly: boolean
}

// ── Drinking icon ─────────────────────────────────────────────────────────────

function DrinkingIcon({ pref }: { pref: Enums<"drinking_preference"> }) {
  if (pref === "yes")   return <Wine       role="img" className="h-3.5 w-3.5 text-brand-accent"        aria-label="Drinking" />
  if (pref === "no")    return <CupSoda    role="img" className="h-3.5 w-3.5 text-muted-foreground"     aria-label="Not drinking" />
  return                       <HelpCircle role="img" className="h-3.5 w-3.5 text-muted-foreground/60" aria-label="Drinking preference: maybe" />
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ profile }: { profile: Profile | null }) {
  const name     = profile?.display_name ?? null
  const src      = profile?.avatar_url   ?? null
  const initials = name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "?"

  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? "Attendee"}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
      />
    )
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
      {initials}
    </span>
  )
}

// ── Single attendee row ───────────────────────────────────────────────────────

function AttendeeRow({ rsvp, isAlcoholFriendly }: { rsvp: Rsvp; isAlcoholFriendly: boolean }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <Avatar profile={rsvp.profiles} />
      <span className="flex-1 truncate text-sm font-medium">
        {rsvp.profiles?.display_name ?? "Unknown"}
      </span>
      {isAlcoholFriendly && (
        <DrinkingIcon pref={rsvp.drinking_preference} />
      )}
    </li>
  )
}

// ── Collapsible group ─────────────────────────────────────────────────────────

const GROUP_CONFIG: Record<
  Enums<"rsvp_status">,
  { label: string; emptyLabel: string; countClass: string }
> = {
  yes:   { label: "Going",         emptyLabel: "No one going yet",   countClass: "text-green-600" },
  maybe: { label: "Maybe",         emptyLabel: "No maybes",          countClass: "text-amber-500" },
  no:    { label: "Can't make it", emptyLabel: "No declines",        countClass: "text-red-500"   },
}

function CollapsibleGroup({
  status,
  rsvps,
  isAlcoholFriendly,
  defaultOpen,
}: {
  status:            Enums<"rsvp_status">
  rsvps:             Rsvp[]
  isAlcoholFriendly: boolean
  defaultOpen:       boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const cfg             = GROUP_CONFIG[status]

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{cfg.label}</span>
          <span className={cn("text-xs font-semibold tabular-nums", cfg.countClass)}>
            {rsvps.length}
          </span>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t px-4">
          {rsvps.length === 0 ? (
            <p className="py-3 text-xs text-muted-foreground">{cfg.emptyLabel}</p>
          ) : (
            <ul className="divide-y" aria-label={`${cfg.label} attendees`}>
              {rsvps.map((r) => (
                <AttendeeRow key={r.id} rsvp={r} isAlcoholFriendly={isAlcoholFriendly} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AttendeeList({ rsvps, eventId, organiserId, currentUserId, isAlcoholFriendly }: Props) {
  const isOrganiser  = currentUserId === organiserId
  const hasRsvp      = rsvps.some((r) => r.user_id === currentUserId)
  const canSeeFull   = isOrganiser || hasRsvp

  const byStatus = {
    yes:   rsvps.filter((r) => r.status === "yes"),
    maybe: rsvps.filter((r) => r.status === "maybe"),
    no:    rsvps.filter((r) => r.status === "no"),
  }

  return (
    <section aria-labelledby="attendees-heading" className="space-y-3">
      <h2
        id="attendees-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Attendees
      </h2>

      {!canSeeFull ? (
        /* ── Gate: not yet RSVPd ── */
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">RSVP to see who's coming</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The attendee list is visible to guests who've RSVPd.
            </p>
          </div>
          <Link
            href={`/events/${eventId}/rsvp`}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors"
          >
            RSVP now
          </Link>
        </div>
      ) : (
        /* ── Full attendee list, grouped by status ── */
        <div className="space-y-2">
          {(["yes", "maybe", "no"] as const).map((status) => (
            <CollapsibleGroup
              key={status}
              status={status}
              rsvps={byStatus[status]}
              isAlcoholFriendly={isAlcoholFriendly}
              defaultOpen={status === "yes"}
            />
          ))}
        </div>
      )}
    </section>
  )
}
