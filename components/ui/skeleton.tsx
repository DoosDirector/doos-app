import { cn } from "@/lib/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden="true"
      {...props}
    />
  )
}

// ── Composite skeletons for common patterns ───────────────────────────────────

export function SkeletonAvatar({ size = 32 }: { size?: number }) {
  return (
    <Skeleton
      className="shrink-0 rounded-full"
      style={{ width: size, height: size }}
    />
  )
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 && lines > 1 ? "w-4/5" : "w-full")}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={40} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  )
}

/** Mirrors the exact layout of <EventCard> for the dashboard loading state. */
export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      {/* Type icon badge */}
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-2">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-full" />
        </div>
        {/* Meta row */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Chevron */}
      <Skeleton className="h-4 w-4 shrink-0 rounded" />
    </div>
  )
}
