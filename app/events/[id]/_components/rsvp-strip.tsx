import Image from "next/image"
import Link from "next/link"
import { Check, X, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Tables, Enums } from "@/types"

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = Pick<Tables<"profiles">, "display_name" | "avatar_url">

type Rsvp = Pick<Tables<"rsvps">, "id" | "status" | "user_id"> & {
  profiles: Profile | null
}

type Props = {
  rsvps: Rsvp[]
  eventId: string
  currentUserId: string
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Enums<"rsvp_status">,
  { label: string; icon: React.ElementType; chipClass: string; iconClass: string }
> = {
  yes:   { label: "Going",    icon: Check,       chipClass: "bg-green-100 text-green-700", iconClass: "text-green-600" },
  maybe: { label: "Maybe",    icon: HelpCircle,  chipClass: "bg-amber-100 text-amber-700", iconClass: "text-amber-500" },
  no:    { label: "Declined", icon: X,           chipClass: "bg-red-100   text-red-700",   iconClass: "text-red-500"   },
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
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RsvpStrip({ rsvps, eventId, currentUserId }: Props) {
  const byStatus = {
    yes:   rsvps.filter((r) => r.status === "yes"),
    maybe: rsvps.filter((r) => r.status === "maybe"),
    no:    rsvps.filter((r) => r.status === "no"),
  }

  const myRsvp      = rsvps.find((r) => r.user_id === currentUserId)
  const totalGoing  = byStatus.yes.length + byStatus.maybe.length

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
        <Button asChild size="sm" variant={myRsvp ? "outline" : "default"}>
          <Link href={`/events/${eventId}/rsvp`}>
            {myRsvp ? "Change RSVP" : "RSVP now"}
          </Link>
        </Button>
      </div>

      {/* Status groups */}
      <div className="grid grid-cols-3 gap-4">
        {(["yes", "maybe", "no"] as const).map((s) => (
          <StatusGroup key={s} status={s} rsvps={byStatus[s]} />
        ))}
      </div>

      {/* Current user's RSVP */}
      {myRsvp && (
        <div className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
          STATUS_CONFIG[myRsvp.status].chipClass
        )}>
          {(() => { const Icon = STATUS_CONFIG[myRsvp.status].icon; return <Icon className="h-3.5 w-3.5" aria-hidden="true" /> })()}
          Your RSVP: {STATUS_CONFIG[myRsvp.status].label}
        </div>
      )}
    </section>
  )
}
