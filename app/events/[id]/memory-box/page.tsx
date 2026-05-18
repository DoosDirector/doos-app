import { notFound }   from "next/navigation"
import Link           from "next/link"
import Image          from "next/image"
import type { Metadata } from "next"
import { ChevronLeft, Camera, PlayCircle, PlusCircle } from "lucide-react"
import { requireUser }  from "@/lib/auth/guard"
import { createClient } from "@/lib/supabase/server"

const BUCKET = "memories"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }    = await params
  const supabase  = await createClient(true)
  const { data }  = await supabase.from("events").select("title").eq("id", id).single()
  return { title: data ? `Memory Box — ${data.title}` : "Memory Box" }
}

export default async function MemoryBoxPage({ params }: Props) {
  const [{ id }] = await Promise.all([params, requireUser()])

  const supabase = await createClient(true)

  const [{ data: event }, { data: rawMemories }] = await Promise.all([
    supabase.from("events").select("id, title").eq("id", id).single(),
    supabase
      .from("memories")
      .select("id, storage_path, media_type, caption, created_at, uploader_id, profiles:profiles!memories_uploader_id_fkey(display_name)")
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
  ])

  if (!event) notFound()

  // Resolve public URLs — getPublicUrl is synchronous
  const memories = (rawMemories ?? []).map((m) => {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(m.storage_path)
    return { ...m, publicUrl: urlData.publicUrl }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      {/* Back + header */}
      <div className="space-y-1">
        <Link
          href={`/events/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to event
        </Link>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Memory Box</h1>
            <p className="text-sm text-muted-foreground line-clamp-1">{event.title}</p>
          </div>
          <Link
            href={`/events/${id}/memory-box/upload`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add memory
          </Link>
        </div>
      </div>

      {memories.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-16 text-center">
          <Camera className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <div>
            <p className="font-medium">No memories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to share a photo or video from the event.
            </p>
          </div>
          <Link
            href={`/events/${id}/memory-box/upload`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add a memory
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {memories.length} {memories.length === 1 ? "memory" : "memories"}
          </p>

          {/* ── Responsive media grid ── */}
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
            role="list"
            aria-label="Memories"
          >
            {memories.map((m) => {
              const uploaderName =
                m.profiles && !Array.isArray(m.profiles)
                  ? (m.profiles as { display_name: string | null }).display_name
                  : Array.isArray(m.profiles) && m.profiles.length > 0
                  ? (m.profiles[0] as { display_name: string | null }).display_name
                  : null

              return (
                <div
                  key={m.id}
                  role="listitem"
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                >
                  {m.media_type === "image" ? (
                    <Image
                      src={m.publicUrl}
                      alt={m.caption ?? "Memory photo"}
                      fill
                      sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    /* Video: dark card with centred play icon */
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-900">
                      <PlayCircle
                        className="h-10 w-10 text-white/80"
                        aria-hidden="true"
                      />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                        Video
                      </span>
                    </div>
                  )}

                  {/* Bottom overlay: caption + uploader */}
                  {(m.caption || uploaderName) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {m.caption && (
                        <p className="truncate text-[11px] font-medium text-white">
                          {m.caption}
                        </p>
                      )}
                      {uploaderName && (
                        <p className="truncate text-[10px] text-white/70">
                          {uploaderName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Upload CTA ── */}
          <Link
            href={`/events/${id}/memory-box/upload`}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-medium text-muted-foreground hover:border-brand-primary hover:text-brand-primary transition-colors"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add a memory
          </Link>
        </>
      )}
    </div>
  )
}
