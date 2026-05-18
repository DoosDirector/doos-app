"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RsvpError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">Couldn't load the RSVP form</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            There was a problem loading this page. Check your connection and try again.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          {id && (
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href={`/events/${id}`}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to event
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
