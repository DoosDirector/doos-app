"use client"

import { PlusCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CreateEventData, PollQuestion } from "./create-event-form"

type Props = {
  data: CreateEventData
  onChange: (partial: Partial<CreateEventData>) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function updateAt<T>(arr: T[], i: number, updater: (item: T) => T): T[] {
  return arr.map((item, idx) => (idx === i ? updater(item) : item))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StepPollBuilder({ data, onChange }: Props) {
  const { pollQuestions } = data

  function addQuestion() {
    onChange({
      pollQuestions: [
        ...pollQuestions,
        { text: "", type: "single", options: ["", ""] } satisfies PollQuestion,
      ],
    })
  }

  function removeQuestion(qi: number) {
    onChange({ pollQuestions: pollQuestions.filter((_, i) => i !== qi) })
  }

  function updateQuestionText(qi: number, text: string) {
    onChange({ pollQuestions: updateAt(pollQuestions, qi, (q) => ({ ...q, text })) })
  }

  function addOption(qi: number) {
    onChange({
      pollQuestions: updateAt(pollQuestions, qi, (q) => ({
        ...q,
        options: [...q.options, ""],
      })),
    })
  }

  function updateOption(qi: number, oi: number, value: string) {
    onChange({
      pollQuestions: updateAt(pollQuestions, qi, (q) => ({
        ...q,
        options: q.options.map((opt, i) => (i === oi ? value : opt)),
      })),
    })
  }

  function removeOption(qi: number, oi: number) {
    onChange({
      pollQuestions: updateAt(pollQuestions, qi, (q) => ({
        ...q,
        options: q.options.filter((_, i) => i !== oi),
      })),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Poll questions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add optional polls to help the team decide on venues, times, or anything else.
        </p>
      </div>

      {pollQuestions.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-10 text-center">
          <p className="text-sm text-muted-foreground">No polls yet — add one below.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pollQuestions.map((q, qi) => (
            <div key={qi} className="space-y-3 rounded-xl border bg-muted/30 p-4">
              {/* Question text */}
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`q-${qi}`}>Question {qi + 1}</Label>
                  <Input
                    id={`q-${qi}`}
                    placeholder="Which venue do you prefer?"
                    value={q.text}
                    onChange={(e) => updateQuestionText(qi, e.target.value)}
                    maxLength={200}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(qi)}
                  className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove question ${qi + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Options</Label>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-right text-xs text-muted-foreground">
                      {oi + 1}.
                    </span>
                    <Input
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      className="h-8 text-sm"
                      maxLength={120}
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove option ${oi + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addOption(qi)}
                    className="h-7 gap-1 text-xs"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add option
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={addQuestion}
        className="w-full gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Add poll question
      </Button>
    </div>
  )
}
