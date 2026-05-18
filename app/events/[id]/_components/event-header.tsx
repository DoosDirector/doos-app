import Image from "next/image"
import Link from "next/link"
import {
  CalendarDays, Martini, CupSoda,
  Moon, UtensilsCrossed, Coffee, Zap, PartyPopper,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tables, Enums } from "@/types"

// ── Event type display config ─────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  Enums<"event_type">,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  night_out:     { label: "Night out",     icon: Moon,            badgeClass: "text-violet-700 bg-violet-100" },
  lunch:         { label: "Lunch",         icon: UtensilsCrossed, badgeClass: "text-amber-700  bg-amber-100"  },
  coffee:        { label: "Coffee",        icon: Coffee,          badgeClass: "text-orange-700 bg-orange-100" },
  team_building: { label: "Team building", icon: Zap,             badgeClass: "text-blue-700   bg-blue-100"   },
  activity:      { label: "Activity",      icon: PartyPopper,     badgeClass: "text-green-700  bg-green-100"  },
  other:         { label: "Event",         icon: CalendarDays,    badgeClass: "text-neutral-700 bg-neutral-100" },
}

// ── UK date helpers ───────────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const d    = new Date(iso)
  const now  = new Date()
  const diff = Math.round((d.getTime() - now.getTime()) / 86_400_000)
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  if (diff === 0)  return `Today · ${time}`
  if (diff === 1)  return `Tomorrow · ${time}`
  if (diff === -1) return `Yesterday · ${time}`
  if (diff > 1 && diff < 7) return `${d.toLocaleDateString("en-GB", { weekday: "long" })} · ${time}`
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }) + ` · ${time}`
}

function absoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

// ── Organiser avatar ──────────────────────────────────────────────────────────

function OrgAvatar({ src, name }: { src: string | null; name: string | null }) {
  const initials = name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "?"
  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? "Organiser"}
        width={32}
        height={32}
        className="rounded-full object-cover ring-2 ring-background"
      />
    )
  }
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white ring-2 ring-background"
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  event: Pick<Tables<"events">, "title" | "description" | "type" | "date" | "alcohol_friendly" | "organiser_id">
  organiser: Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url"> | null
  currentUserId: string
}

export function EventHeader({ event, organiser, currentUserId }: Props) {
  const cfg         = TYPE_CONFIG[event.type]
  const TypeIcon    = cfg.icon
  const isOrganiser = event.organiser_id === currentUserId
  const isPast      = event.date ? new Date(event.date) < new Date() : false

  // Use relative label for near dates; absolute for far-future/past
  const primaryDate   = event.date ? relativeDate(event.date) : "Date TBC"
  // Show full absolute date as secondary text when primary is relative (Today/Tomorrow/Yesterday/Weekday)
  const showAbsolute  = event.date && /^(Today|Tomorrow|Yesterday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/.test(primaryDate)
  const secondaryDate = showAbsolute ? absoluteDate(event.date!) : null

  return (
    <header
      className={cn(
        "space-y-5 rounded-2xl border bg-card p-5 shadow-sm",
        isPast && "opacity-75"
      )}
    >
      {/* Row 1: type badge + alcohol pill */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Type badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            cfg.badgeClass
          )}
        >
          <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {cfg.label}
        </span>

        {/* Alcohol indicator — icon + text */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            event.alcohol_friendly
              ? "bg-brand-accent/10 text-brand-accent"
              : "bg-muted text-muted-foreground"
          )}
          aria-label={event.alcohol_friendly ? "Alcohol-friendly event" : "Alcohol-free event"}
        >
          {event.alcohol_friendly
            ? <Martini  className="h-3.5 w-3.5" aria-hidden="true" />
            : <CupSoda  className="h-3.5 w-3.5" aria-hidden="true" />}
          {event.alcohol_friendly ? "Alcohol-friendly" : "Alcohol-free"}
        </span>
      </div>

      {/* Row 2: title */}
      <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
        {event.title}
        {isPast && (
          <span className="ml-2 align-middle text-sm font-medium text-muted-foreground">
            (past event)
          </span>
        )}
      </h1>

      {/* Row 3: date */}
      <div className="flex items-start gap-2 text-sm">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="font-medium text-foreground">{primaryDate}</p>
          {secondaryDate && (
            <p className="text-xs text-muted-foreground">{secondaryDate}</p>
          )}
        </div>
      </div>

      {/* Row 4: description */}
      {event.description && (
        <p className="text-sm leading-relaxed text-foreground/80">{event.description}</p>
      )}

      {/* Divider */}
      <div className="border-t" aria-hidden="true" />

      {/* Row 5: organiser */}
      <div className="flex items-center gap-2.5">
        <OrgAvatar
          src={organiser?.avatar_url ?? null}
          name={organiser?.display_name ?? null}
        />
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Organised by</span>
          <Link
            href={isOrganiser ? "/profile" : "#"}
            className="font-medium text-foreground hover:underline"
            aria-label={`View profile of ${organiser?.display_name ?? "organiser"}`}
          >
            {organiser?.display_name ?? "Unknown"}
          </Link>
          {isOrganiser && (
            <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold text-brand-primary">
              You
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
