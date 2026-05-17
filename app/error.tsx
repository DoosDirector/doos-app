"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      {/* Logo mark */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary shadow-md">
        <span className="text-2xl font-bold text-white">D</span>
      </div>

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
      </div>

      <h1 className="mb-2 text-xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        We hit an unexpected error. Don&apos;t worry — your data is safe. You
        can try again or head back to the dashboard.
      </p>

      {/* Error digest for support reference */}
      {error.digest && (
        <p className="mb-6 rounded-md bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
          Error ref: {error.digest}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="gap-2">
          <Home className="h-4 w-4" aria-hidden="true" />
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
