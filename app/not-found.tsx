import Link from "next/link"
import { SearchX, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      {/* Logo mark */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary shadow-md">
        <span className="text-2xl font-bold text-white">D</span>
      </div>

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>

      <p className="mb-1 text-5xl font-bold text-brand-primary">404</p>
      <h1 className="mb-2 text-xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        This page doesn&apos;t exist or may have been moved. Head back to your
        dashboard to find your events.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/dashboard" className="gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to dashboard
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}
