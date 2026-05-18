import Link from "next/link"
import Image from "next/image"
import { Camera, PlayCircle, PlusCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types"

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
              href={`/events/${eventId}/memories`}
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
            href={`/events/${eventId}/memories/upload`}
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
              <Link
                key={m.id}
                href={`/events/${eventId}/memories`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                aria-label={m.caption ?? (m.media_type === "video" ? "Video memory" : "Photo memory")}
              >
                {m.media_type === "image" ? (
                  <Image
                    src={m.publicUrl}
                    alt={m.caption ?? "Memory"}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  /* Video: show placeholder with play icon */
                  <div className="flex h-full w-full items-center justify-center bg-neutral-900">
                    <PlayCircle
                      className="h-10 w-10 text-white/80 drop-shadow"
                      aria-hidden="true"
                    />
                  </div>
                )}

                {/* Caption tooltip on hover */}
                {m.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <p className="truncate text-[10px] font-medium text-white">{m.caption}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* ── Upload CTA ── */}
          <Link
            href={`/events/${eventId}/memories/upload`}
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
