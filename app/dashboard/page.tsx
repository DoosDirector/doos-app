import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkeletonCard } from "@/components/ui/skeleton"
import { EventList } from "./_components/event-list"

export const metadata: Metadata = {
  title: "Dashboard",
}

function EventListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading events…">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Doos</h1>
          <p className="text-sm text-muted-foreground">Events you&apos;re organising or attending</p>
        </div>
        <Button asChild size="sm" className="gap-2 shrink-0">
          <Link href="/events/create">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Doo
          </Link>
        </Button>
      </div>

      {/* Event list streams in — skeleton shown while fetching */}
      <Suspense fallback={<EventListSkeleton />}>
        <EventList />
      </Suspense>
    </div>
  )
}
