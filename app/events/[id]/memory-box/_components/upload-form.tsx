"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { UploadCloud, X, ImageIcon, Film, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type FileEntry = {
  id:      string
  file:    File
  preview: string   // blob URL; revoked on removal / unmount
  caption: string
}

type Props = {
  eventId:      string
  // uploadMemory will be injected once Task 66 server action is ready
  uploadMemory?: (formData: FormData) => Promise<{ error: string } | void>
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCEPT_MIME = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/quicktime", "video/webm",
]
const ACCEPT_EXT  = ".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm"
const MAX_MB      = 50
const MAX_BYTES   = MAX_MB * 1024 * 1024
const MAX_FILES   = 10

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtSize(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isVideo(file: File) {
  return file.type.startsWith("video/")
}

function fileId() {
  return Math.random().toString(36).slice(2)
}

// ── File preview card ─────────────────────────────────────────────────────────

function FileCard({
  entry,
  onRemove,
  onCaptionChange,
}: {
  entry:           FileEntry
  onRemove:        () => void
  onCaptionChange: (caption: string) => void
}) {
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-3">
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {isVideo(entry.file) ? (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900">
            <Film className="h-6 w-6 text-white/70" aria-hidden="true" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.preview}
            alt=""
            className="h-full w-full object-cover"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Info + caption */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-snug">{entry.file.name}</p>
            <p className="text-xs text-muted-foreground">{fmtSize(entry.file.size)}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Remove ${entry.file.name}`}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-0.5">
          <input
            type="text"
            value={entry.caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Add a caption… (optional)"
            maxLength={140}
            className="w-full rounded-md border bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Caption for ${entry.file.name}`}
          />
          {entry.caption.length > 0 && (
            <p className={`text-right text-[10px] tabular-nums ${entry.caption.length >= 130 ? "text-destructive" : "text-muted-foreground/60"}`}>
              {entry.caption.length}/140
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function UploadForm({ eventId, uploadMemory }: Props) {
  const router   = useRouter()
  const [files,      setFiles]      = useState<FileEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [noFilesErr, setNoFilesErr] = useState(false)
  const [isPending,  startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Revoke blob URLs when entries are removed or on unmount
  useEffect(() => {
    return () => { files.forEach((f) => URL.revokeObjectURL(f.preview)) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    const valid: File[] = []
    const errors: string[] = []

    for (const f of arr) {
      if (!ACCEPT_MIME.includes(f.type)) {
        errors.push(`${f.name}: unsupported file type`)
        continue
      }
      if (f.size > MAX_BYTES) {
        errors.push(`${f.name}: exceeds ${MAX_MB} MB limit`)
        continue
      }
      valid.push(f)
    }

    if (errors.length) toast.error(errors[0], { description: errors.length > 1 ? `…and ${errors.length - 1} more` : undefined })

    setFiles((prev) => {
      const remaining = MAX_FILES - prev.length
      const toAdd = valid.slice(0, remaining)
      if (valid.length > remaining) toast.warning(`Only ${MAX_FILES} files allowed — extra files ignored.`)
      return [
        ...prev,
        ...toAdd.map((file) => ({
          id:      fileId(),
          file,
          preview: URL.createObjectURL(file),
          caption: "",
        })),
      ]
    })
    if (valid.length > 0) setNoFilesErr(false)
  }, [])

  function removeFile(id: string) {
    setFiles((prev) => {
      const entry = prev.find((f) => f.id === id)
      if (entry) URL.revokeObjectURL(entry.preview)
      return prev.filter((f) => f.id !== id)
    })
  }

  function updateCaption(id: string, caption: string) {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, caption } : f))
  }

  // ── Drag + drop ────────────────────────────────────────────────────────────

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleUpload() {
    if (files.length === 0) {
      setNoFilesErr(true)
      if (!uploadMemory) toast.info("Upload coming soon", { description: "The upload action will be wired in the next update." })
      return
    }
    setNoFilesErr(false)
    if (!uploadMemory) {
      toast.info("Upload coming soon", { description: "The upload action will be wired in the next update." })
      return
    }

    const toastId = toast.loading(
      files.length === 1 ? "Uploading memory…" : `Uploading ${files.length} memories…`
    )

    startTransition(async () => {
      for (const entry of files) {
        const fd = new FormData()
        fd.append("eventId", eventId)
        fd.append("file",    entry.file)
        fd.append("caption", entry.caption)

        const result = await uploadMemory(fd)
        if (result?.error) {
          toast.dismiss(toastId)
          toast.error(`Failed to upload ${entry.file.name}`, { description: result.error })
          return
        }
      }
      toast.dismiss(toastId)
      toast.success(
        files.length === 1 ? "Memory uploaded!" : `${files.length} memories uploaded!`,
        { description: "Your photos and videos have been saved." }
      )
      setFiles([])
      router.push(`/events/${eventId}/memory-box`)
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload photos or videos — click, drag and drop, or press Enter to choose files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click() } }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging
            ? "border-brand-primary bg-brand-primary/5"
            : "border-border hover:border-brand-primary/50 hover:bg-muted/40"
        )}
      >
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
          isDragging ? "bg-brand-primary/10" : "bg-muted"
        )}>
          {isDragging
            ? <UploadCloud className="h-7 w-7 text-brand-primary" aria-hidden="true" />
            : <ImageIcon   className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          }
        </div>

        <div>
          <p className="font-medium text-sm">
            {isDragging ? "Drop files here" : "Drag photos & videos here"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            or <span className="text-brand-primary font-medium">tap to choose files</span>
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            JPG, PNG, WEBP, GIF, MP4, MOV, WEBM · max {MAX_MB} MB each · up to {MAX_FILES} files
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_EXT}
          className="sr-only"
          aria-label="Choose photos or videos"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }}
        />
      </div>

      {/* Selected file cards */}
      {files.length > 0 && (
        <div className="space-y-2" aria-label="Selected files" role="list">
          {files.map((entry) => (
            <div key={entry.id} role="listitem">
              <FileCard
                entry={entry}
                onRemove={() => removeFile(entry.id)}
                onCaptionChange={(caption) => updateCaption(entry.id, caption)}
              />
            </div>
          ))}
        </div>
      )}

      {noFilesErr && files.length === 0 && (
        <p role="alert" className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Please add at least one photo or video before uploading.
        </p>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={isPending}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3",
          "text-sm font-semibold text-white transition-colors",
          "hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Uploading…</>
          : <><UploadCloud className="h-4 w-4" aria-hidden="true" /> Upload {files.length > 0 ? `${files.length} ${files.length === 1 ? "file" : "files"}` : "memories"}</>
        }
      </button>
    </div>
  )
}
