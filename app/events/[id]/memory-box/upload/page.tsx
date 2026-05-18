import { notFound }   from "next/navigation"
import Link           from "next/link"
import type { Metadata } from "next"
import { ChevronLeft } from "lucide-react"
import { requireUser }  from "@/lib/auth/guard"
import { createClient } from "@/lib/supabase/server"
import { UploadForm }    from "../_components/upload-form"
import { uploadMemory } from "@/lib/actions/events"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }   = await params
  const supabase = await createClient(true)
  const { data } = await supabase.from("events").select("title").eq("id", id).single()
  return { title: data ? `Add memory — ${data.title}` : "Add memory" }
}

export default async function UploadPage({ params }: Props) {
  const [{ id }] = await Promise.all([params, requireUser()])

  const supabase = await createClient(true)
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", id)
    .single()

  if (eventErr && eventErr.code !== "PGRST116") throw new Error(eventErr.message)
  if (!event) notFound()

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      {/* Back */}
      <Link
        href={`/events/${id}/memory-box`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to Memory Box
      </Link>

      {/* Heading */}
      <div>
        <h1 className="text-xl font-bold">Add a memory</h1>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{event.title}</p>
      </div>

      {/* Upload form */}
      <UploadForm eventId={event.id} uploadMemory={uploadMemory} />
    </div>
  )
}
