"use client"

import Link from "next/link"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PublicEventError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-primary/5 to-background px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
      </div>
      <p className="mt-4 font-semibold">Couldn't load this event</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        There was a problem loading the event. Check your connection and try again.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button onClick={reset} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}
