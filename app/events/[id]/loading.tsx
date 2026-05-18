import { Skeleton, SkeletonText, SkeletonAvatar } from "@/components/ui/skeleton"

function EventHeaderSkeleton() {
  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>
      <Skeleton className="h-8 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 shrink-0 rounded" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="border-t" />
      <div className="flex items-center gap-2.5">
        <SkeletonAvatar size={32} />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <SkeletonText lines={rows} />
    </div>
  )
}

export default function EventLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <EventHeaderSkeleton />
      <SectionSkeleton rows={2} />
      <SectionSkeleton rows={3} />
      <SectionSkeleton rows={2} />
    </div>
  )
}
