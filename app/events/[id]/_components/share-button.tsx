"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type Props = { shareToken: string }

export function ShareButton({ shareToken }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/e/${shareToken}`

    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my Doo!", url })
        return
      } catch {
        // User cancelled — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Link copied!", { description: "Share it with your team." })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleShare}
      className="gap-2"
    >
      {copied
        ? <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
        : <Share2 className="h-4 w-4" aria-hidden="true" />}
      {copied ? "Copied!" : "Share Doo"}
    </Button>
  )
}
