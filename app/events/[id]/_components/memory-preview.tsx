import Link from "next/link"
import { Camera, PlusCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types"
import { MediaCard } from "../memory-box/_components/media-card"

const BUCKET = "memories"

type Memory = Pick<Tables<"memories">, "id" | "storage_path" | "media_type" | "caption">

type Props = { memories: Memory[]; eventId: string }

export async function MemoryPreview({ memories, eventId }: Props) {
  const preview = memories.slice(0, 4)

  // Resolve public URLs (getPublicUrl is synchronous — no extra round-trips)
  const supabase    = await createClient(true)
  const previewUrls = preview.map((m) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(m.storage_path)
    return { ...m, publicUrl: data.publicUrl }
  })

  return (
    <section aria-labelledby="memories-heading" className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          id="memories-heading"
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Memory box
        </h2>
        <div className="flex items-center gap-3">
          {memories.length > 0 && (
            <Link
              href={`/events/${eventId}/memory-box`}
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              View all ({memories.length})
            </Link>
          )}
        </div>
      </div>

      {previewUrls.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
          <Camera className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No memories yet — photos and videos will appear here after the event.
          </p>
          <Link
            href={`/events/${eventId}/memory-box/upload`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add a memory
          </Link>
        </div>
      ) : (
        <>
          {/* ── Thumbnail grid ── */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {previewUrls.map((m) => (
              <MediaCard
                key={m.id}
                publicUrl={m.publicUrl}
                mediaType={m.media_type as "image" | "video"}
                caption={m.caption}
                sizes="(min-width: 640px) 25vw, 50vw"
              />
            ))}
          </div>

          {/* ── Upload CTA ── */}
          <Link
            href={`/events/${eventId}/memory-box/upload`}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-medium text-muted-foreground hover:border-brand-primary hover:text-brand-primary transition-colors"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add a memory
          </Link>
        </>
      )}
    </section>
  )
}
