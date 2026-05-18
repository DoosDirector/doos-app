import Link from "next/link"
import Image from "next/image"
import { Camera } from "lucide-react"
import type { Tables } from "@/types"

type Memory = Pick<Tables<"memories">, "id" | "storage_path" | "media_type" | "caption">

type Props = { memories: Memory[]; eventId: string }

export function MemoryPreview({ memories, eventId }: Props) {
  const preview = memories.slice(0, 4)

  return (
    <section aria-labelledby="memories-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="memories-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Memory box
        </h2>
        {memories.length > 0 && (
          <Link href={`/events/${eventId}/memories`}
            className="text-xs font-medium text-brand-primary hover:underline">
            View all ({memories.length})
          </Link>
        )}
      </div>

      {preview.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
          <Camera className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No memories yet. Photos and videos will appear here after the event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {preview.map((m) => (
            <div key={m.id} className="aspect-square overflow-hidden rounded-xl bg-muted">
              {m.media_type === "image" ? (
                <Image
                  src={m.storage_path}
                  alt={m.caption ?? "Memory"}
                  width={200}
                  height={200}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Video
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
