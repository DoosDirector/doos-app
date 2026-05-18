"use client"

import { useState, useEffect } from "react"
import { Share2, Check, Link2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ── Teams SVG icon ────────────────────────────────────────────────────────────

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.625 7.5h-5.25V12a3.375 3.375 0 0 1-3.375 3.375H9.375A4.875 4.875 0 0 0 14.25 18h6.375A1.875 1.875 0 0 0 22.5 16.125v-6.75A1.875 1.875 0 0 0 20.625 7.5Z" />
      <circle cx="17.25" cy="4.875" r="2.25" />
      <path d="M10.125 7.5H3.375A1.875 1.875 0 0 0 1.5 9.375v6.75A1.875 1.875 0 0 0 3.375 18h6.75A1.875 1.875 0 0 0 12 16.125v-6.75A1.875 1.875 0 0 0 10.125 7.5ZM6.75 13.5a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
    </svg>
  )
}

// ── Slack SVG icon ────────────────────────────────────────────────────────────

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  shareToken:  string
  eventTitle?: string
}

// ── Icon button ───────────────────────────────────────────────────────────────

function ShareBtn({
  onClick, label, active, children,
}: {
  onClick: () => void
  label:   string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        active
          ? "border-green-500 bg-green-50 text-green-700"
          : "border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ShareButton({ shareToken, eventTitle }: Props) {
  const [copied,       setCopied]       = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  // Detect Web Share API availability client-side (unavailable during SSR)
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share)
  }, [])

  function shareUrl() {
    return `${window.location.origin}/e/${shareToken}`
  }

  // ── Copy link — always goes to clipboard ──────────────────────────────────

  async function handleCopy() {
    const url = shareUrl()
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for older browsers / insecure contexts
      const el = document.createElement("textarea")
      el.value = url
      el.style.position = "fixed"
      el.style.opacity  = "0"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setCopied(true)
    toast.success("Link copied!", { description: "Paste it anywhere to share your Doo." })
    setTimeout(() => setCopied(false), 2500)
  }

  // ── Native share (mobile / supported browsers only) ───────────────────────

  async function handleNativeShare() {
    try {
      await navigator.share({ title: eventTitle ?? "Join my Doo!", url: shareUrl() })
    } catch {
      // User cancelled — no-op
    }
  }

  // ── Teams deep link ───────────────────────────────────────────────────────
  // https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/share-to-teams-from-web-apps

  function handleTeams() {
    const url = shareUrl()
    const teamsUrl =
      `https://teams.microsoft.com/share` +
      `?href=${encodeURIComponent(url)}` +
      `&preview=true` +
      (eventTitle ? `&title=${encodeURIComponent(eventTitle)}` : "")
    window.open(teamsUrl, "_blank", "noopener,noreferrer,width=700,height=560")
  }

  // ── Slack deep link ───────────────────────────────────────────────────────
  // Slack has no universal web share endpoint — open the app via the slack://
  // protocol with a pre-filled message, falling back to clipboard copy so
  // the user can paste into any Slack channel or DM.

  async function handleSlack() {
    const url = shareUrl()
    const message = eventTitle ? `${eventTitle} — ${url}` : url

    // Try the slack:// deep link (works when Slack desktop/mobile is installed)
    const slackUri = `slack://open?message=${encodeURIComponent(message)}`
    window.location.href = slackUri

    // After a short delay, fall back to clipboard if Slack didn't open
    await new Promise((r) => setTimeout(r, 1200))
    await navigator.clipboard.writeText(url)
    toast.success("Link copied for Slack!", {
      description: "Paste it into any Slack channel or DM.",
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Copy link — always clipboard */}
      <ShareBtn onClick={handleCopy} label="Copy share link" active={copied}>
        {copied
          ? <Check className="h-4 w-4" aria-hidden="true" />
          : <Link2 className="h-4 w-4" aria-hidden="true" />}
        {copied ? "Copied!" : "Copy link"}
      </ShareBtn>

      {/* Native share — only shown when Web Share API is available */}
      {canNativeShare && (
        <ShareBtn onClick={handleNativeShare} label="Share via…">
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share
        </ShareBtn>
      )}

      {/* Post to Teams */}
      <ShareBtn onClick={handleTeams} label="Post to Microsoft Teams">
        <TeamsIcon className="h-4 w-4 text-[#6264a7]" />
        <span>Teams</span>
      </ShareBtn>

      {/* Post to Slack */}
      <ShareBtn onClick={handleSlack} label="Post to Slack">
        <SlackIcon className="h-4 w-4" />
        <span>Slack</span>
      </ShareBtn>
    </div>
  )
}
