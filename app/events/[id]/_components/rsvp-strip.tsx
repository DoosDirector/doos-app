import Image from "next/image"
import Link from "next/link"
import { Check, X, HelpCircle, Wine, CupSoda } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Tables, Enums } from "@/types"

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = Pick<Tables<"profiles">, "display_name" | "avatar_url">

type Rsvp = Pick<Tables<"rsvps">, "id" | "status" | "drinking_preference" | "user_id"> & {
  profiles: Profile | null
}

type Props = {
  rsvps:           Rsvp[]
  eventId:         string
  currentUserId:   string
  isAlcoholFriendly: boolean
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Enums<"rsvp_status">,
  {
    label:        string
    sentence:     string
    icon:         React.ElementType
    chipClass:    string
    iconClass:    string
    confirmClass: string
  }
> = {
  yes:   {
    label:        "Going",
    sentence:     "You are going",
    icon:         Check,
    chipClass:    "bg-green-100 text-green-700",
    iconClass:    "text-green-600",
    confirmClass: "border-green-200 bg-green-50 text-green-800",
  },
  maybe: {
    label:        "Maybe",
    sentence:     "You said maybe",
    icon:         HelpCircle,
    chipClass:    "bg-amber-100 text-amber-700",
    iconClass:    "text-amber-500",
    confirmClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  no:    {
    label:        "Can't make it",
    sentence:     "You are not going",
    icon:         X,
    chipClass:    "bg-red-100 text-red-700",
    iconClass:    "text-red-500",
    confirmClass: "border-red-200 bg-red-50 text-red-800",
  },
}

const DRINKING_LABEL: Record<Enums<"drinking_preference">, { label: string; icon: React.ElementType }> = {
  yes:   { label: "You'll be drinking",      icon: Wine    },
  maybe: { label: "Drinking: not sure yet",  icon: Wine    },
  no:    { label: "Not drinking",            icon: CupSoda },
}

// ── Mini avatar ───────────────────────────────────────────────────────────────

function MiniAvatar({ profile }: { profile: Profile | null }) {
  const name     = profile?.display_name ?? null
  const src      = profile?.avatar_url   ?? null
  const initials = name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "?"

  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? "Attendee"}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full object-cover"
      />
    )
  }
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white"
      aria-label={name ?? "Attendee"}
    >
      {initials}
    </span>
  )
}

// ── Overlapping avatar stack ──────────────────────────────────────────────────

const STACK_MAX = 4

function AvatarStack({ rsvps }: { rsvps: Rsvp[] }) {
  if (rsvps.length === 0) {
    return <div className="h-7 text-xs text-muted-foreground/60 leading-7">—</div>
  }
  const shown = rsvps.slice(0, STACK_MAX)
  const extra = rsvps.length - shown.length

  return (
    <div className="flex items-center" aria-label={`${rsvps.length} attendees`}>
      {shown.map((r, i) => (
        <div
          key={r.id}
          className={cn("ring-2 ring-background rounded-full", i > 0 && "-ml-2")}
          title={r.profiles?.display_name ?? undefined}
        >
          <MiniAvatar profile={r.profiles} />
        </div>
      ))}
      {extra > 0 && (
        <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[10px] font-semibold text-muted-foreground">
          +{extra}
        </div>
      )}
    </div>
  )
}

// ── Status group ──────────────────────────────────────────────────────────────

function StatusGroup({ status, rsvps }: { status: Enums<"rsvp_status">; rsvps: Rsvp[] }) {
  const { label, icon: Icon, iconClass } = STATUS_CONFIG[status]
  return (
    <div className="flex flex-col gap-1.5">
      <AvatarStack rsvps={rsvps} />
      <div className="flex items-center gap-1">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} aria-hidden="true" />
        <span className="text-sm font-semibold">{rsvps.length}</span>
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

// ── My RSVP confirmation ──────────────────────────────────────────────────────

function MyRsvpConfirmation({
  rsvp,
  eventId,
  isAlcoholFriendly,
}: {
  rsvp: Rsvp
  eventId: string
  isAlcoholFriendly: boolean
}) {
  const cfg              = STATUS_CONFIG[rsvp.status]
  const Icon             = cfg.icon
  const drinkingCfg      = DRINKING_LABEL[rsvp.drinking_preference]
  const DrinkIcon        = drinkingCfg.icon
  const showDrinking     = isAlcoholFriendly

  return (
    <div className={cn("rounded-xl border px-4 py-3 space-y-2", cfg.confirmClass)}>
      {/* Status sentence */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold">{cfg.sentence}</span>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0 h-7 text-xs px-2.5">
          <Link href={`/events/${eventId}/rsvp`}>Change RSVP</Link>
        </Button>
      </div>

      {/* Drinking preference */}
      {showDrinking && (
        <div className="flex items-center gap-1.5 text-xs opacity-80">
          <DrinkIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{drinkingCfg.label}</span>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RsvpStrip({ rsvps, eventId, currentUserId, isAlcoholFriendly }: Props) {
  const byStatus = {
    yes:   rsvps.filter((r) => r.status === "yes"),
    maybe: rsvps.filter((r) => r.status === "maybe"),
    no:    rsvps.filter((r) => r.status === "no"),
  }

  const myRsvp     = rsvps.find((r) => r.user_id === currentUserId)
  const totalGoing = byStatus.yes.length + byStatus.maybe.length

  return (
    <section aria-labelledby="rsvp-heading" className="rounded-xl border bg-card p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 id="rsvp-heading" className="text-sm font-semibold">RSVPs</h2>
          {totalGoing > 0 && (
            <p className="text-xs text-muted-foreground">
              {totalGoing} {totalGoing === 1 ? "person" : "people"} attending
            </p>
          )}
        </div>
        {!myRsvp && (
          <Button asChild size="sm">
            <Link href={`/events/${eventId}/rsvp`}>RSVP now</Link>
          </Button>
        )}
      </div>

      {/* Status groups */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {(["yes", "maybe", "no"] as const).map((s) => (
          <StatusGroup key={s} status={s} rsvps={byStatus[s]} />
        ))}
      </div>

      {/* Current user's RSVP confirmation */}
      {myRsvp && (
        <MyRsvpConfirmation
          rsvp={myRsvp}
          eventId={eventId}
          isAlcoholFriendly={isAlcoholFriendly}
        />
      )}
    </section>
  )
}
