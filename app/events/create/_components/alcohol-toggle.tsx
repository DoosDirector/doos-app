"use client"

import { Martini, CupSoda } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

type Props = {
  value: boolean
  onChange: (value: boolean) => void
}

export function AlcoholToggle({ value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <Label id="alcohol-label">Alcohol-friendly?</Label>

      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-labelledby="alcohol-label"
        aria-describedby="alcohol-hint"
        onClick={() => onChange(!value)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          value
            ? "border-brand-accent bg-brand-accent/5"
            : "border-input bg-background hover:bg-muted/50"
        )}
      >
        {/* Left: icon + label */}
        <div className="flex items-center gap-3">
          {value ? (
            <Martini className="h-5 w-5 text-brand-accent" aria-hidden="true" />
          ) : (
            <CupSoda className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">
            {value ? "Alcohol-friendly" : "Alcohol-free"}
          </span>
        </div>

        {/* Right: animated pill */}
        <div
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent",
            "transition-colors duration-200 ease-in-out",
            value ? "bg-brand-accent" : "bg-input"
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg",
              "transform transition duration-200 ease-in-out",
              value ? "translate-x-5" : "translate-x-0"
            )}
          />
        </div>
      </button>

      <p id="alcohol-hint" className="text-xs text-muted-foreground">
        {value
          ? "Attendees who don't drink will still be able to join and RSVP."
          : "This event is alcohol-free — great for all attendees."}
      </p>
    </div>
  )
}
