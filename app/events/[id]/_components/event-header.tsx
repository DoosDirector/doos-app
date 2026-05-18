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

// ── UK date formatter ─────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "Date TBC"
  const d    = new Date(iso)
  const now  = new Date()
  const diff = Math.round((d.getTime() - now.getTime()) / 86_400_000)
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  if (diff === 0)  return `Today · ${time}`
  if (diff === 1)  return `Tomorrow · ${time}`
  if (diff === -1) return "Yesterday"
  if (diff > 1 && diff < 7) return `${d.toLocaleDateString("en-GB", { weekday: "long" })} · ${time}`
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

// ── Organiser avatar ──────────────────────────────────────────────────────────

function OrgAvatar({ src, name }: { src: string | null; name: string | null }) {
  const initials = name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "?"
  if (src) return (
    <Image src={src} alt={name ?? "Organiser"} width={28} height={28}
      className="rounded-full object-cover ring-2 ring-background" />
  )
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white ring-2 ring-background">
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

  return (
    <header className="space-y-4">
      {/* Type badge + alcohol */}
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", cfg.badgeClass)}>
          <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {cfg.label}
        </span>
        <span
          title={event.alcohol_friendly ? "Alcohol-friendly" : "Alcohol-free"}
          aria-label={event.alcohol_friendly ? "Alcohol-friendly event" : "Alcohol-free event"}
        >
          {event.alcohol_friendly
            ? <Martini className="h-5 w-5 text-brand-accent" aria-hidden="true" />
            : <CupSoda  className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold leading-tight text-foreground">{event.title}</h1>

      {/* Date */}
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
        {formatDate(event.date)}
      </p>

      {/* Description */}
      {event.description && (
        <p className="text-sm leading-relaxed text-foreground/80">{event.description}</p>
      )}

      {/* Organiser */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <OrgAvatar src={organiser?.avatar_url ?? null} name={organiser?.display_name ?? null} />
        <span>
          Organised by{" "}
          <Link href="/profile" className="font-medium text-foreground hover:underline">
            {organiser?.display_name ?? "Unknown"}
          </Link>
          {isOrganiser && (
            <span className="ml-1.5 rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
              You
            </span>
          )}
        </span>
      </div>
    </header>
  )
}
