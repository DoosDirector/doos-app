"use client"

import { useState, useTransition } from "react"
import { Check, X, HelpCircle, Wine, CupSoda, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { upsertRsvp } from "@/lib/actions/events"
import type { Enums } from "@/types"

// ── Types ─────────────────────────────────────────────────────────────────────

type RsvpStatus          = Enums<"rsvp_status">
type DrinkingPreference  = Enums<"drinking_preference">

type Props = {
  eventId:         string
  alcoholFriendly: boolean
  initialStatus?:  RsvpStatus
  initialDrinking?: DrinkingPreference
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: RsvpStatus
  label: string
  icon: React.ElementType
  selectedClass: string
  hoverClass: string
}[] = [
  {
    value:         "yes",
    label:         "Going",
    icon:          Check,
    selectedClass: "border-green-500 bg-green-50 text-green-700",
    hoverClass:    "hover:border-green-300 hover:bg-green-50/50",
  },
  {
    value:         "maybe",
    label:         "Maybe",
    icon:          HelpCircle,
    selectedClass: "border-amber-400 bg-amber-50 text-amber-700",
    hoverClass:    "hover:border-amber-300 hover:bg-amber-50/50",
  },
  {
    value:         "no",
    label:         "Can't make it",
    icon:          X,
    selectedClass: "border-red-400 bg-red-50 text-red-700",
    hoverClass:    "hover:border-red-300 hover:bg-red-50/50",
  },
]

const DRINKING_OPTIONS: {
  value: DrinkingPreference
  label: string
  sub: string
  icon: React.ElementType
}[] = [
  { value: "yes",   label: "Yes",        sub: "I'll be drinking",         icon: Wine    },
  { value: "maybe", label: "Maybe",      sub: "Depends on the night",     icon: Wine    },
  { value: "no",    label: "Not for me", sub: "Driving or don't drink",   icon: CupSoda },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function RsvpForm({ eventId, alcoholFriendly, initialStatus, initialDrinking }: Props) {
  const [status,      setStatus]      = useState<RsvpStatus | undefined>(initialStatus)
  const [drinking,    setDrinking]    = useState<DrinkingPreference>(initialDrinking ?? "maybe")
  const [statusError, setStatusError] = useState(false)
  const [isPending,   startTransition] = useTransition()

  function handleSubmit() {
    if (!status) {
      setStatusError(true)
      return
    }

    startTransition(async () => {
      const result = await upsertRsvp({
        eventId,
        status,
        drinkingPreference: drinking,
      })
      if (result?.error) {
        toast.error("Couldn't save your RSVP", { description: result.error })
      }
      // On success upsertRsvp redirects back to the event page
    })
  }

  return (
    <div className="space-y-6">
      {/* ── Attendance ── */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">
          Are you going?{" "}
          <span className="text-destructive" aria-hidden="true">*</span>
        </legend>
        <div
          className="grid grid-cols-3 gap-3"
          role="radiogroup"
          aria-label="Attendance"
          aria-required="true"
          aria-describedby={statusError ? "status-error" : undefined}
        >
          {STATUS_OPTIONS.map(({ value, label, icon: Icon, selectedClass, hoverClass }) => {
            const isSelected = status === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => { setStatus(value); setStatusError(false) }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-4 text-sm font-medium transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isSelected ? selectedClass : cn("border-border text-foreground", hoverClass)
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </button>
            )
          })}
        </div>
        {statusError && (
          <p id="status-error" role="alert" className="mt-2 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Please select your attendance before continuing.
          </p>
        )}
      </fieldset>

      {/* ── Drinking preference (only for alcohol-friendly events) ── */}
      {alcoholFriendly && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Will you be drinking?</legend>
          <div className="space-y-2" role="radiogroup" aria-label="Drinking preference">
            {DRINKING_OPTIONS.map(({ value, label, sub, icon: Icon }) => {
              const isSelected = drinking === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setDrinking(value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    isSelected
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-border hover:border-brand-primary/40 hover:bg-muted/50"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", isSelected ? "text-brand-primary" : "text-muted-foreground")}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium", isSelected && "text-brand-primary")}>{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                  {isSelected && (
                    <Check className="ml-auto h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {/* ── Submit ── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !status}
        className={cn(
          "w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white",
          "transition-colors hover:bg-brand-primary/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "flex items-center justify-center gap-2"
        )}
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {isPending ? "Saving…" : (initialStatus ? "Update RSVP" : "Confirm RSVP")}
      </button>
    </div>
  )
}
