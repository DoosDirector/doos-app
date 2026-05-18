import Link from "next/link"
import { Check, X, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Tables } from "@/types"

type Rsvp = Pick<Tables<"rsvps">, "id" | "status" | "user_id">

type Props = {
  rsvps: Rsvp[]
  eventId: string
  currentUserId: string
}

const STATUS_CONFIG = {
  yes:   { label: "Going",    icon: Check,       className: "bg-green-100  text-green-700"  },
  no:    { label: "Declined", icon: X,            className: "bg-red-100    text-red-700"    },
  maybe: { label: "Maybe",    icon: HelpCircle,   className: "bg-amber-100  text-amber-700"  },
} as const

export function RsvpStrip({ rsvps, eventId, currentUserId }: Props) {
  const counts = {
    yes:   rsvps.filter((r) => r.status === "yes").length,
    no:    rsvps.filter((r) => r.status === "no").length,
    maybe: rsvps.filter((r) => r.status === "maybe").length,
  }

  const myRsvp = rsvps.find((r) => r.user_id === currentUserId)

  return (
    <section aria-labelledby="rsvp-heading" className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 id="rsvp-heading" className="text-sm font-semibold">RSVPs</h2>
        <Button asChild size="sm" variant={myRsvp ? "outline" : "default"}>
          <Link href={`/events/${eventId}/rsvp`}>
            {myRsvp ? "Change RSVP" : "RSVP now"}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["yes", "maybe", "no"] as const).map((status) => {
          const { label, icon: Icon, className } = STATUS_CONFIG[status]
          return (
            <span key={status}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className}`}>
              <Icon className="h-3 w-3" aria-hidden="true" />
              {counts[status]} {label}
            </span>
          )
        })}
      </div>

      {myRsvp && (
        <p className="text-xs text-muted-foreground">
          Your RSVP: <strong className="text-foreground">{STATUS_CONFIG[myRsvp.status].label}</strong>
        </p>
      )}
    </section>
  )
}
