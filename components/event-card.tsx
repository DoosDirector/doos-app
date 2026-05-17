import Link from "next/link"
import {
  ChevronRight,
  CalendarDays,
  Users,
  Martini,
  CupSoda,
  Moon,
  UtensilsCrossed,
  Coffee,
  Zap,
  PartyPopper,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Event } from "@/types"

// ── Event type config ─────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG = {
  night_out:     { label: "Night out",      icon: Moon,            colour: "text-violet-500  bg-violet-50"  },
  lunch:         { label: "Lunch",          icon: UtensilsCrossed, colour: "text-amber-500   bg-amber-50"   },
  coffee:        { label: "Coffee",         icon: Coffee,          colour: "text-orange-500  bg-orange-50"  },
  team_building: { label: "Team building",  icon: Zap,             colour: "text-blue-500    bg-blue-50"    },
  activity:      { label: "Activity",       icon: PartyPopper,     colour: "text-green-500   bg-green-50"   },
  other:         { label: "Event",          icon: CalendarDays,    colour: "text-neutral-500 bg-neutral-100" },
} as const satisfies Record<
  Event["type"],
  { label: string; icon: React.ElementType; colour: string }
>

// ── Date formatting ───────────────────────────────────────────────────────────

function formatEventDate(isoDate: string | null): string {
  if (!isoDate) return "Date TBC"

  const date = new Date(isoDate)
  const now = new Date()
  const diffDays = Math.round((date.getTime() - now.getTime()) / 86_400_000)

  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (diffDays === 0) return `Today · ${timeStr}`
  if (diffDays === 1) return `Tomorrow · ${timeStr}`
  if (diffDays === -1) return "Yesterday"
  if (diffDays > 1 && diffDays < 7) {
    return `${date.toLocaleDateString("en-GB", { weekday: "long" })} · ${timeStr}`
  }

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

// ── EventCard ─────────────────────────────────────────────────────────────────

export type EventCardProps = {
  event: Event & { rsvp_count?: number }
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.type]
  const TypeIcon = config.icon
  const isPast = event.date ? new Date(event.date) < new Date() : false

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "group flex items-center gap-4 rounded-xl border bg-card p-4",
        "shadow-sm transition-all duration-150 hover:shadow-md hover:border-brand-primary/30",
        isPast && "opacity-60",
        className
      )}
    >
      {/* Type icon badge */}
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          config.colour
        )}
        aria-hidden="true"
      >
        <TypeIcon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn(
            "truncate font-semibold leading-tight transition-colors",
            "text-foreground group-hover:text-brand-primary"
          )}>
            {event.title}
          </h3>

          {/* Alcohol indicator */}
          <span
            title={event.alcohol_friendly ? "Alcohol-friendly" : "No alcohol"}
            aria-label={event.alcohol_friendly ? "Alcohol-friendly event" : "Alcohol-free event"}
            className="shrink-0"
          >
            {event.alcohol_friendly ? (
              <Martini className="h-4 w-4 text-brand-accent" />
            ) : (
              <CupSoda className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {/* Date */}
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {formatEventDate(event.date)}
          </span>

          {/* RSVP count */}
          {event.rsvp_count !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              {event.rsvp_count === 1
                ? "1 going"
                : `${event.rsvp_count} going`}
            </span>
          )}

          {/* Type label — visible on wider cards */}
          <span className="hidden sm:inline rounded-full border px-2 py-0.5 text-[10px] font-medium">
            {config.label}
          </span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  )
}
