"use client"

import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StepBasicDetails } from "./step-basic-details"
import { StepPollBuilder } from "./step-poll-builder"
import { StepMapStops } from "./step-map-stops"
import { createEvent } from "@/lib/actions/events"
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
  alcoholFriendly: true,
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
  const [isPending, startTransition] = useTransition()

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

  function handleSubmit() {
    startTransition(async () => {
      const result = await createEvent({
        title:           data.title,
        description:     data.description || undefined,
        date:            data.date || undefined,
        type:            data.type,
        alcoholFriendly: data.alcoholFriendly,
        pollQuestions:   data.pollQuestions,
        stops:           data.stops,
      })
      // result is only defined on error; success triggers a redirect
      if (result?.error) {
        toast.error("Could not create Doo", { description: result.error })
      }
    })
  }

  const isLastStep = step === STEPS.length - 1

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
        {step === 2 && <StepMapStops data={data} onChange={update} />}
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 0 || isPending}
        >
          Back
        </Button>

        {!isLastStep ? (
          <Button type="button" onClick={handleNext} disabled={isPending}>
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="min-w-[110px]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Creating…
              </>
            ) : (
              "Create Doo"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
