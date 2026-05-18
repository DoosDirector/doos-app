"use client"

import {
  Moon,
  UtensilsCrossed,
  Coffee,
  Zap,
  PartyPopper,
  CalendarDays,
} from "lucide-react"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import type { EventType } from "@/types"

// ── Config ────────────────────────────────────────────────────────────────────

export const EVENT_TYPE_OPTIONS: {
  value: EventType
  label: string
  icon: React.ElementType
  activeClass: string
}[] = [
  { value: "night_out",     label: "Night out",     icon: Moon,            activeClass: "text-violet-600 bg-violet-50 border-violet-400" },
  { value: "lunch",         label: "Lunch",         icon: UtensilsCrossed, activeClass: "text-amber-600 bg-amber-50 border-amber-400"   },
  { value: "coffee",        label: "Coffee",        icon: Coffee,          activeClass: "text-orange-600 bg-orange-50 border-orange-400" },
  { value: "team_building", label: "Team building", icon: Zap,             activeClass: "text-blue-600 bg-blue-50 border-blue-400"      },
  { value: "activity",      label: "Activity",      icon: PartyPopper,     activeClass: "text-green-600 bg-green-50 border-green-400"   },
  { value: "other",         label: "Other",         icon: CalendarDays,    activeClass: "text-neutral-600 bg-neutral-100 border-neutral-400" },
]

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  value: EventType
  onChange: (type: EventType) => void
}

export function EventTypePicker({ value, onChange }: Props) {
  const groupRef = useRef<HTMLDivElement>(null)

  function focusOption(index: number) {
    const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>("[role='radio']")
    buttons?.[index]?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    const last = EVENT_TYPE_OPTIONS.length - 1
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      const next = i < last ? i + 1 : 0
      onChange(EVENT_TYPE_OPTIONS[next].value)
      focusOption(next)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      const prev = i > 0 ? i - 1 : last
      onChange(EVENT_TYPE_OPTIONS[prev].value)
      focusOption(prev)
    }
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Event type"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6"
    >
      {EVENT_TYPE_OPTIONS.map(({ value: v, label, icon: Icon, activeClass }, i) => {
        const selected = value === v
        return (
          <button
            key={v}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(v)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 text-xs font-medium",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selected
                ? cn(activeClass, "scale-[1.06] shadow-sm")
                : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-center leading-tight">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
