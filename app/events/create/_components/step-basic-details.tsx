"use client"

import {
  Martini,
  CupSoda,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EventTypePicker } from "./event-type-picker"
import type { CreateEventData } from "./create-event-form"

const TITLE_MAX = 120
const DESC_MAX  = 500

// ── Helpers ───────────────────────────────────────────────────────────────────

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

function CharCount({ current, max }: { current: number; max: number }) {
  const near = current > max * 0.85
  return (
    <span
      className={cn("text-xs tabular-nums", near ? "text-destructive" : "text-muted-foreground")}
      aria-live="polite"
    >
      {current}/{max}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  data: CreateEventData
  onChange: (partial: Partial<CreateEventData>) => void
  showErrors?: boolean
}

export function StepBasicDetails({ data, onChange, showErrors = false }: Props) {
  const titleError = showErrors && data.title.trim().length === 0
    ? "Event title is required"
    : null

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">
            Event title{" "}
            <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <CharCount current={data.title.length} max={TITLE_MAX} />
        </div>
        <Input
          id="title"
          placeholder="Summer social"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={TITLE_MAX}
          required
          autoFocus
          aria-required="true"
          aria-invalid={titleError ? "true" : "false"}
          aria-describedby={titleError ? "title-error" : undefined}
          className={cn(titleError && "border-destructive focus-visible:ring-destructive")}
        />
        {titleError && <FieldError id="title-error" message={titleError} />}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <CharCount current={data.description.length} max={DESC_MAX} />
        </div>
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
          maxLength={DESC_MAX}
        />
      </div>

      {/* Date & time */}
      <div className="space-y-1.5">
        <Label htmlFor="date">Date &amp; time</Label>
        <Input
          id="date"
          type="datetime-local"
          value={data.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Enter the time in UK local time (GMT/BST — your device timezone is used).
        </p>
      </div>

      {/* Event type selector */}
      <div className="space-y-2">
        <Label>
          Event type{" "}
          <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <EventTypePicker
          value={data.type}
          onChange={(type) => onChange({ type })}
        />
      </div>

      {/* Alcohol toggle */}
      <div className="space-y-1.5">
        <Label id="alcohol-label">Alcohol-friendly?</Label>
        <button
          type="button"
          role="switch"
          aria-checked={data.alcoholFriendly}
          aria-labelledby="alcohol-label"
          onClick={() => onChange({ alcoholFriendly: !data.alcoholFriendly })}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
