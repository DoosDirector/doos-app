import { notFound }   from "next/navigation"
import Link           from "next/link"
import type { Metadata } from "next"
import { ChevronLeft, Camera, PlusCircle } from "lucide-react"
import { requireUser }  from "@/lib/auth/guard"
import { createClient } from "@/lib/supabase/server"
import { MediaCard }    from "./_components/media-card"
import { ShareButton }  from "../_components/share-button"

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
    supabase.from("events").select("id, title, share_token").eq("id", id).single(),
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
                <div key={m.id} role="listitem">
                  <MediaCard
                    publicUrl={m.publicUrl}
                    mediaType={m.media_type as "image" | "video"}
                    caption={m.caption}
                    uploaderName={uploaderName}
                  />
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

          {/* ── Share memories ── */}
          {event.share_token && (
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-sm font-medium">Share these memories</p>
              <p className="text-xs text-muted-foreground">
                Invite others to see the Memory Box and add their own photos and videos.
              </p>
              <ShareButton shareToken={event.share_token} eventTitle={event.title} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
