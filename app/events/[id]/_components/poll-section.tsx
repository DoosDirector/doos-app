import { BarChart2 } from "lucide-react"
import type { Tables } from "@/types"

type PollOption   = Pick<Tables<"poll_options">,   "id" | "option_text">
type PollQuestion = Pick<Tables<"poll_questions">, "id" | "question_text"> & {
  poll_options: PollOption[]
}

type Props = { questions: PollQuestion[] }

export function PollSection({ questions }: Props) {
  if (questions.length === 0) return null

  return (
    <section aria-labelledby="polls-heading" className="space-y-3">
      <h2 id="polls-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Polls
      </h2>

      <div className="space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="rounded-xl border bg-card p-4 space-y-3">
            <p className="font-medium text-sm">{q.question_text}</p>

            <ul className="space-y-2">
              {q.poll_options.map((opt) => (
                <li key={opt.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span>{opt.option_text}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BarChart2 className="h-3 w-3" aria-hidden="true" />
                    0 votes
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground">
              Voting will be enabled in an upcoming update.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
