"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Tables } from "@/types"

// ── Types ─────────────────────────────────────────────────────────────────────

type PollVote     = Pick<Tables<"poll_votes">,    "id" | "user_id">
type PollOption   = Pick<Tables<"poll_options">,  "id" | "option_text"> & { poll_votes: PollVote[] }
type PollQuestion = Pick<Tables<"poll_questions">, "id" | "question_text"> & { poll_options: PollOption[] }

type Props = {
  questions: PollQuestion[]
  currentUserId: string
}

// ── Vote percentage bar ───────────────────────────────────────────────────────

function VoteBar({ pct, active }: { pct: number; active: boolean }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          active ? "bg-brand-primary" : "bg-muted-foreground/30"
        )}
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

// ── Single poll question card ─────────────────────────────────────────────────

function PollCard({
  question,
  currentUserId,
}: {
  question: PollQuestion
  currentUserId: string
}) {
  const totalVotes = question.poll_options.reduce(
    (sum, o) => sum + o.poll_votes.length, 0
  )

  // Track optimistic user-voted option (undefined = not voted yet or loading)
  const initialVote = question.poll_options.find((o) =>
    o.poll_votes.some((v) => v.user_id === currentUserId)
  )?.id

  const [votedOptionId, setVotedOptionId] = useState<string | undefined>(initialVote)
  const [isPending, startTransition]      = useTransition()

  function handleVote(optionId: string) {
    if (isPending || votedOptionId === optionId) return

    // Optimistic update
    setVotedOptionId(optionId)

    startTransition(async () => {
      // TODO (Task 51): replace with castVote(optionId, question.id) server action
      toast.info("Voting coming soon", {
        description: "Live voting will be enabled in the next update.",
      })
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      {/* Question */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm leading-snug">{question.question_text}</p>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>
      </div>

      {/* Options */}
      <ul className="space-y-3" role="list">
        {question.poll_options.map((option) => {
          const count   = option.poll_votes.length
          const pct     = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
          const isVoted = votedOptionId === option.id

          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => handleVote(option.id)}
                disabled={isPending}
                aria-pressed={isVoted}
                className={cn(
                  "w-full rounded-lg border-2 px-3 py-2.5 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isVoted
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-transparent bg-muted/50 hover:bg-muted",
                  isPending && "cursor-not-allowed opacity-60"
                )}
              >
                {/* Row: text + count */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {isVoted && (
                      <CheckCircle2
                        className="h-3.5 w-3.5 shrink-0 text-brand-primary"
                        aria-label="Your vote"
                      />
                    )}
                    <span className={cn(
                      "truncate text-sm",
                      isVoted ? "font-semibold text-brand-primary" : "text-foreground"
                    )}>
                      {option.option_text}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                    {isPending && isVoted && (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    )}
                    <span className="tabular-nums font-medium">{pct}%</span>
                    <span className="text-muted-foreground/60">({count})</span>
                  </div>
                </div>

                {/* Progress bar */}
                <VoteBar pct={pct} active={isVoted} />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Vote hint */}
      {!votedOptionId && (
        <p className="text-xs text-muted-foreground">
          Tap an option to cast your vote.
        </p>
      )}
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export function PollSection({ questions, currentUserId }: Props) {
  if (questions.length === 0) return null

  return (
    <section aria-labelledby="polls-heading" className="space-y-3">
      <h2
        id="polls-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Polls
      </h2>

      <div className="space-y-3">
        {questions.map((q) => (
          <PollCard key={q.id} question={q} currentUserId={currentUserId} />
        ))}
      </div>
    </section>
  )
}
