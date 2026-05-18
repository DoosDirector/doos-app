"use client"

import { useState, useTransition, useEffect, useMemo } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { castVote } from "@/lib/actions/events"
import { createClient } from "@/lib/supabase/client"
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

// Votes indexed by vote-id → { option_id, user_id } so we can handle both
// INSERT (full new record) and DELETE (only old.id) realtime events accurately.
type VoteEntry = { option_id: string; user_id: string }

function buildInitialVoteMap(question: PollQuestion): Map<string, VoteEntry> {
  const map = new Map<string, VoteEntry>()
  question.poll_options.forEach((o) => {
    o.poll_votes.forEach((v) => map.set(v.id, { option_id: o.id, user_id: v.user_id }))
  })
  return map
}

function PollCard({
  question,
  currentUserId,
}: {
  question: PollQuestion
  currentUserId: string
}) {
  // Live vote map — updated via Realtime
  const [voteMap, setVoteMap] = useState<Map<string, VoteEntry>>(
    () => buildInitialVoteMap(question)
  )

  const voteCountsByOption = useMemo(() => {
    const counts: Record<string, number> = {}
    question.poll_options.forEach((o) => { counts[o.id] = 0 })
    for (const v of voteMap.values()) {
      counts[v.option_id] = (counts[v.option_id] ?? 0) + 1
    }
    return counts
  }, [voteMap, question.poll_options])

  const totalVotes = voteMap.size

  // Current user's voted option
  const initialVote = [...voteMap.values()].find((v) => v.user_id === currentUserId)?.option_id
  const [votedOptionId, setVotedOptionId] = useState<string | undefined>(initialVote)
  const [isPending, startTransition]      = useTransition()

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel  = supabase
      .channel(`poll-votes:${question.id}`)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "poll_votes",
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const r = payload.new as { id: string; option_id: string; user_id: string }
            setVoteMap((m) => new Map(m).set(r.id, { option_id: r.option_id, user_id: r.user_id }))
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as { id: string }).id
            setVoteMap((m) => { const next = new Map(m); next.delete(id); return next })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [question.id])

  // ── Vote handler ───────────────────────────────────────────────────────────
  function handleVote(optionId: string) {
    if (isPending || votedOptionId === optionId) return

    const previous = votedOptionId
    setVotedOptionId(optionId)

    startTransition(async () => {
      const result = await castVote(optionId, question.id)
      if (result?.error) {
        setVotedOptionId(previous)
        toast.error("Couldn't save your vote", { description: result.error })
      } else {
        toast.success("Vote recorded!", { duration: 2000 })
      }
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      {/* Question */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm leading-snug">{question.question_text}</p>
        <span
          className="shrink-0 text-xs text-muted-foreground tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>
      </div>

      {/* Options */}
      <ul className="space-y-3" role="list">
        {question.poll_options.map((option) => {
          const count   = voteCountsByOption[option.id] ?? 0
          const pct     = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
          const isVoted = votedOptionId === option.id

          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => handleVote(option.id)}
                disabled={isPending}
                aria-pressed={isVoted}
                aria-label={`${option.option_text}${isVoted ? " — your vote" : ""}, ${pct}% (${count} ${count === 1 ? "vote" : "votes"})`}
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
                        aria-hidden="true"
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
