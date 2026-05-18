"use client"

import { PlusCircle, Trash2, CheckCircle2, ListChecks, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CreateEventData, PollQuestion } from "./create-event-form"

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

const OPTIONS_MIN = 2
const OPTIONS_MAX = 8
const QUESTIONS_MAX = 10

// ── Helpers ───────────────────────────────────────────────────────────────────

function updateAt<T>(arr: T[], i: number, fn: (item: T) => T): T[] {
  return arr.map((item, idx) => (idx === i ? fn(item) : item))
}

function newQuestion(): PollQuestion {
  return { text: "", type: "single", options: ["", ""] }
}

// ── Question type toggle ──────────────────────────────────────────────────────

type QuestionType = PollQuestion["type"]

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ElementType; hint: string }[] = [
  { value: "single",   label: "Single choice",   icon: CheckCircle2, hint: "Voters pick one answer" },
  { value: "multiple", label: "Multiple choice",  icon: ListChecks,   hint: "Voters pick all that apply" },
]

function QuestionTypeToggle({
  value,
  onChange,
  id,
}: {
  value: QuestionType
  onChange: (v: QuestionType) => void
  id: string
}) {
  const selected = QUESTION_TYPES.find((t) => t.value === value)!
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        Answer type
      </Label>
      <div
        role="radiogroup"
        aria-label="Answer type"
        className="flex gap-2"
      >
        {QUESTION_TYPES.map(({ value: v, label, icon: Icon }) => {
          const active = value === v
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                active
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                  : "border-input bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">{selected.hint}</p>
    </div>
  )
}

// ── Single question card ──────────────────────────────────────────────────────

type CardProps = {
  question: PollQuestion
  index: number
  total: number
  showErrors: boolean
  onUpdate: (fn: (q: PollQuestion) => PollQuestion) => void
  onRemove: () => void
}

function PollQuestionCard({ question: q, index: qi, total, showErrors, onUpdate, onRemove }: CardProps) {
  const nonEmptyOptions = q.options.filter((o) => o.trim())
  const textError    = showErrors && !q.text.trim() ? "Question text is required" : null
  const optionsError = showErrors && nonEmptyOptions.length < OPTIONS_MIN
    ? `At least ${OPTIONS_MIN} non-empty options required`
    : null
  function setType(type: QuestionType) {
    onUpdate((q) => ({ ...q, type }))
  }

  function setText(text: string) {
    onUpdate((q) => ({ ...q, text }))
  }

  function setOption(oi: number, value: string) {
    onUpdate((q) => ({ ...q, options: q.options.map((o, i) => (i === oi ? value : o)) }))
  }

  function addOption() {
    onUpdate((q) => ({ ...q, options: [...q.options, ""] }))
  }

  function removeOption(oi: number) {
    onUpdate((q) => ({ ...q, options: q.options.filter((_, i) => i !== oi) }))
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Question {qi + 1}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground",
              "hover:bg-destructive/10 hover:text-destructive transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label={`Remove question ${qi + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Remove
          </button>
        )}
      </div>

      {/* Question text */}
      <div className="space-y-1.5">
        <Label htmlFor={`q-${qi}-text`}>
          Question <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id={`q-${qi}-text`}
          placeholder="Where should we go?"
          value={q.text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          aria-invalid={textError ? "true" : "false"}
          aria-describedby={textError ? `q-${qi}-text-error` : undefined}
          className={cn(textError && "border-destructive focus-visible:ring-destructive")}
        />
        {textError && <FieldError id={`q-${qi}-text-error`} message={textError} />}
      </div>

      {/* Answer type */}
      <QuestionTypeToggle
        id={`q-${qi}-type`}
        value={q.type}
        onChange={setType}
      />

      {/* Options */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Options{" "}
          <span className="font-normal">
            ({q.options.length}/{OPTIONS_MAX})
          </span>
        </Label>

        <ol className="space-y-2" aria-label={`Options for question ${qi + 1}`}>
          {q.options.map((opt, oi) => (
            <li key={oi} className="flex items-center gap-2">
              <span
                className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground"
                aria-hidden="true"
              >
                {oi + 1}.
              </span>
              <Input
                aria-label={`Question ${qi + 1}, option ${oi + 1}`}
                placeholder={`Option ${oi + 1}`}
                value={opt}
                onChange={(e) => setOption(oi, e.target.value)}
                className="h-8 text-sm"
                maxLength={120}
              />
              {q.options.length > OPTIONS_MIN && (
                <button
                  type="button"
                  onClick={() => removeOption(oi)}
                  className="shrink-0 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label={`Remove option ${oi + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ol>

        {optionsError && <FieldError id={`q-${qi}-options-error`} message={optionsError} />}

        {q.options.length < OPTIONS_MAX && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addOption}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Add option
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  data: CreateEventData
  onChange: (partial: Partial<CreateEventData>) => void
  showErrors?: boolean
}

export function StepPollBuilder({ data, onChange, showErrors = false }: Props) {
  const { pollQuestions: questions } = data

  function setQuestions(qs: PollQuestion[]) {
    onChange({ pollQuestions: qs })
  }

  function addQuestion() {
    setQuestions([...questions, newQuestion()])
  }

  function removeQuestion(qi: number) {
    setQuestions(questions.filter((_, i) => i !== qi))
  }

  function updateQuestion(qi: number, fn: (q: PollQuestion) => PollQuestion) {
    setQuestions(updateAt(questions, qi, fn))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold">Poll questions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional — add polls to let the team vote on venues, times, or anything else.
          Polls can be single or multiple choice.
        </p>
      </div>

      {/* Question cards */}
      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <PollQuestionCard
              key={qi}
              question={q}
              index={qi}
              total={questions.length}
              showErrors={showErrors}
              onUpdate={(fn) => updateQuestion(qi, fn)}
              onRemove={() => removeQuestion(qi)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {questions.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No polls yet. Add one to help the team decide!
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-2">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add your first poll
          </Button>
        </div>
      )}

      {/* Add question button (shown when questions exist) */}
      {questions.length > 0 && questions.length < QUESTIONS_MAX && (
        <Button
          type="button"
          variant="outline"
          onClick={addQuestion}
          className="w-full gap-2"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Add poll question
        </Button>
      )}

      {questions.length >= QUESTIONS_MAX && (
        <p className="text-center text-xs text-muted-foreground">
          Maximum of {QUESTIONS_MAX} poll questions reached.
        </p>
      )}
    </div>
  )
}
