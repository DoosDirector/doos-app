import { EventCardSkeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-28 animate-pulse rounded-md bg-muted" aria-hidden="true" />
          <div className="h-4 w-48 animate-pulse rounded-md bg-muted" aria-hidden="true" />
        </div>
        <div className="h-8 w-20 animate-pulse rounded-md bg-muted" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
