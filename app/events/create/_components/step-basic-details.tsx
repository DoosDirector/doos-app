"use client"

import {
  Moon,
  UtensilsCrossed,
  Coffee,
  Zap,
  PartyPopper,
  CalendarDays,
  Martini,
  CupSoda,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CreateEventData } from "./create-event-form"
import type { EventType } from "@/types"

// ── Event type options ────────────────────────────────────────────────────────

const EVENT_TYPES: {
  value: EventType
  label: string
  icon: React.ElementType
  activeClass: string
}[] = [
  { value: "night_out",     label: "Night out",     icon: Moon,            activeClass: "text-violet-600 bg-violet-50 border-violet-400" },
  { value: "lunch",         label: "Lunch",         icon: UtensilsCrossed, activeClass: "text-amber-600 bg-amber-50 border-amber-400" },
  { value: "coffee",        label: "Coffee",        icon: Coffee,          activeClass: "text-orange-600 bg-orange-50 border-orange-400" },
  { value: "team_building", label: "Team building", icon: Zap,             activeClass: "text-blue-600 bg-blue-50 border-blue-400" },
  { value: "activity",      label: "Activity",      icon: PartyPopper,     activeClass: "text-green-600 bg-green-50 border-green-400" },
  { value: "other",         label: "Other",         icon: CalendarDays,    activeClass: "text-neutral-600 bg-neutral-100 border-neutral-400" },
]

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  data: CreateEventData
  onChange: (partial: Partial<CreateEventData>) => void
}

export function StepBasicDetails({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Event title <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Summer social"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={120}
          required
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className={cn(
            "flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          placeholder="What's the plan?"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          maxLength={500}
        />
      </div>

      {/* Date & time */}
      <div className="space-y-1.5">
        <Label htmlFor="date">
          Date &amp; time{" "}
          <span className="text-xs font-normal text-muted-foreground">(UK time)</span>
        </Label>
        <Input
          id="date"
          type="datetime-local"
          value={data.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </div>

      {/* Event type selector */}
      <div className="space-y-2">
        <Label>
          Event type <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {EVENT_TYPES.map(({ value, label, icon: Icon, activeClass }) => {
            const selected = data.type === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ type: value })}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-medium transition-all",
                  selected
                    ? cn(activeClass, "scale-105 shadow-sm")
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Alcohol toggle */}
      <div className="space-y-1.5">
        <Label>Alcohol-friendly?</Label>
        <button
          type="button"
          onClick={() => onChange({ alcoholFriendly: !data.alcoholFriendly })}
          aria-pressed={data.alcoholFriendly}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-all",
            data.alcoholFriendly
              ? "border-brand-accent bg-brand-accent/5"
              : "border-input bg-background hover:bg-muted/50"
          )}
        >
          <div className="flex items-center gap-3">
            {data.alcoholFriendly ? (
              <Martini className="h-5 w-5 text-brand-accent" aria-hidden="true" />
            ) : (
              <CupSoda className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            )}
            <span className="text-sm font-medium">
              {data.alcoholFriendly ? "Alcohol-friendly event" : "Alcohol-free event"}
            </span>
          </div>
          {/* Toggle pill */}
          <div
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
              data.alcoholFriendly ? "bg-brand-accent" : "bg-input"
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg",
                "transform transition duration-200 ease-in-out",
                data.alcoholFriendly ? "translate-x-5" : "translate-x-0"
              )}
            />
          </div>
        </button>
      </div>
    </div>
  )
}
