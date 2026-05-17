"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StepBasicDetails } from "./step-basic-details"
import { StepPollBuilder } from "./step-poll-builder"
import { StepMapStops } from "./step-map-stops"
import type { EventType } from "@/types"

// ── Form state ────────────────────────────────────────────────────────────────

export type PollQuestion = {
  text: string
  type: "single" | "multiple"
  options: string[]
}

export type CreateEventData = {
  title: string
  description: string
  date: string
  type: EventType
  alcoholFriendly: boolean
  pollQuestions: PollQuestion[]
  stops: { placeId: string; name: string; address: string; lat: number; lng: number }[]
}

const INITIAL_DATA: CreateEventData = {
  title: "",
  description: "",
  date: "",
  type: "other",
  alcoholFriendly: false,
  pollQuestions: [],
  stops: [],
}

const STEPS = [
  { label: "Details" },
  { label: "Polls" },
  { label: "Stops" },
]

// ── Stepper indicator ─────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Form steps" className="flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex items-center flex-1 last:flex-none">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              i < current
                ? "bg-brand-primary text-white"
                : i === current
                ? "bg-brand-primary text-white ring-4 ring-brand-primary/20"
                : "bg-muted text-muted-foreground"
            )}
            aria-current={i === current ? "step" : undefined}
          >
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={cn(
              "ml-2 hidden text-sm font-medium sm:block",
              i === current ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mx-3 h-px flex-1 transition-colors",
                i < current ? "bg-brand-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </nav>
  )
}

// ── Main form shell ───────────────────────────────────────────────────────────

export function CreateEventForm() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<CreateEventData>(INITIAL_DATA)
  const [step1Attempted, setStep1Attempted] = useState(false)

  function update(partial: Partial<CreateEventData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  const isStep1Valid = data.title.trim().length > 0

  function handleNext() {
    if (step === 0 && !isStep1Valid) {
      setStep1Attempted(true)
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <div className="space-y-6">
      <StepIndicator current={step} />

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        {step === 0 && (
          <StepBasicDetails
            data={data}
            onChange={update}
            showErrors={step1Attempted}
          />
        )}
        {step === 1 && <StepPollBuilder data={data} onChange={update} />}
        {step === 2 && <StepMapStops />}
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
        >
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button type="button" disabled>
            Create Doo
          </Button>
        )}
      </div>
    </div>
  )
}
