"use client"

import { useState, useRef, useTransition } from "react"
import Image from "next/image"
import { PlayCircle, PauseCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteMemory } from "@/lib/actions/events"

type Props = {
  publicUrl:    string
  mediaType:    "image" | "video"
  caption?:     string | null
  uploaderName?: string | null
  sizes?:       string
  // Delete support — only rendered when canDelete is true
  memoryId?:    string
  eventId?:     string
  canDelete?:   boolean
}

export function MediaCard({ publicUrl, mediaType, caption, uploaderName, sizes, memoryId, eventId, canDelete }: Props) {
  const [isPlaying,  setIsPlaying]  = useState(false)
  const [isDeleted,  setIsDeleted]  = useState(false)
  const [isPending,  startTransition] = useTransition()
  const videoRef = useRef<HTMLVideoElement>(null)

  function handleDelete() {
    if (!memoryId || !eventId) return
    startTransition(async () => {
      const toastId = toast.loading("Deleting memory…")
      const result  = await deleteMemory(memoryId, eventId)
      toast.dismiss(toastId)
      if (result?.error) {
        toast.error("Couldn't delete memory", { description: result.error })
      } else {
        setIsDeleted(true)
        toast.success("Memory deleted")
      }
    })
  }

  if (isDeleted) return null

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setIsPlaying(true)
    } else {
      v.pause()
      setIsPlaying(false)
    }
  }

  const hasOverlay = caption || uploaderName

  return (
    <div className={`group relative aspect-square overflow-hidden rounded-xl bg-muted transition-opacity ${isPending ? "opacity-50" : ""}`}>
      {mediaType === "image" ? (
        <Image
          src={publicUrl}
          alt={caption ?? "Memory photo"}
          fill
          sizes={sizes ?? "(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            src={publicUrl}
            muted
            loop
            playsInline
            onEnded={() => setIsPlaying(false)}
            className="h-full w-full object-cover"
          />

          {/* Play/pause overlay */}
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ opacity: isPlaying ? 0 : 1 }}
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <PauseCircle className="h-10 w-10 text-white/90 drop-shadow" aria-hidden="true" />
            ) : (
              <PlayCircle className="h-10 w-10 text-white/90 drop-shadow" aria-hidden="true" />
            )}
          </button>
        </>
      )}

      {/* Delete button — top-right, organiser/uploader only */}
      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Delete memory"
          className="absolute right-1.5 top-1.5 z-10 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}

      {/* Caption + uploader overlay */}
      {hasOverlay && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {caption && (
            <p className="truncate text-[11px] font-medium text-white">{caption}</p>
          )}
          {uploaderName && (
            <p className="truncate text-[10px] text-white/70">{uploaderName}</p>
          )}
        </div>
      )}
    </div>
  )
}
