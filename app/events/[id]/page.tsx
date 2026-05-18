import type { Metadata } from "next"
import { CreatedToast } from "./_components/created-toast"

export const metadata: Metadata = {
  title: "Event",
}

type Props = {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EventPage({ params, searchParams }: Props) {
  const { id }  = await params
  const sp      = await searchParams
  const justCreated = sp.created === "1"

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {justCreated && <CreatedToast />}

      {/* Placeholder — full event detail implemented in Task 44 */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Event <span className="font-mono text-xs">{id}</span>
        </p>
        <p className="text-base font-semibold">Event detail page coming soon</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Full event view, polls, RSVP, and map will be built in the next tasks.
        </p>
      </div>
    </div>
  )
}
