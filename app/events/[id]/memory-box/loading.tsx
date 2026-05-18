import { Skeleton } from "@/components/ui/skeleton"

export default function MemoryBoxLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      {/* Back + header */}
      <div className="space-y-1">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  )
}
