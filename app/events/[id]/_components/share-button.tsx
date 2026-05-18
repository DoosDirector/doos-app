"use client"

import { useState, useEffect } from "react"
import { Share2, Check, Link2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { buildShareIntents } from "@/lib/share"

// ── Brand SVG icons ───────────────────────────────────────────────────────────

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.625 7.5h-5.25V12a3.375 3.375 0 0 1-3.375 3.375H9.375A4.875 4.875 0 0 0 14.25 18h6.375A1.875 1.875 0 0 0 22.5 16.125v-6.75A1.875 1.875 0 0 0 20.625 7.5Z" />
      <circle cx="17.25" cy="4.875" r="2.25" />
      <path d="M10.125 7.5H3.375A1.875 1.875 0 0 0 1.5 9.375v6.75A1.875 1.875 0 0 0 3.375 18h6.75A1.875 1.875 0 0 0 12 16.125v-6.75A1.875 1.875 0 0 0 10.125 7.5ZM6.75 13.5a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
    </svg>
  )
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  shareToken:    string
  eventTitle?:   string
  memoryTeaser?: string
}

// ── Shared button shell ───────────────────────────────────────────────────────

function ShareBtn({
  onClick, label, active, children,
}: {
  onClick:  () => void
  label:    string
  active?:  boolean
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

// ── Clipboard helper ──────────────────────────────────────────────────────────

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement("textarea")
    el.value = text
    el.style.cssText = "position:fixed;opacity:0"
    document.body.appendChild(el)
    el.select()
    document.execCommand("copy")
    document.body.removeChild(el)
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function ShareButton({ shareToken, eventTitle, memoryTeaser }: Props) {
  const [copied,         setCopied]         = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share)
  }, [])

  function intents() {
    return buildShareIntents({ shareToken, eventTitle, memoryTeaser })
  }

  // ── Copy link ─────────────────────────────────────────────────────────────

  async function handleCopy() {
    await copyToClipboard(intents().shareUrl)
    setCopied(true)
    toast.success("Link copied!", { description: "Paste it anywhere to share your Doo." })
    setTimeout(() => setCopied(false), 2500)
  }

  // ── Native share ──────────────────────────────────────────────────────────

  async function handleNativeShare() {
    const { shareUrl, message } = intents()
    try {
      await navigator.share({ title: eventTitle ?? "Join my Doo!", text: message, url: shareUrl })
    } catch { /* cancelled */ }
  }

  // ── LinkedIn ──────────────────────────────────────────────────────────────

  function handleLinkedIn() {
    window.open(intents().linkedin, "_blank", "noopener,noreferrer,width=600,height=600")
  }

  // ── Facebook ──────────────────────────────────────────────────────────────

  function handleFacebook() {
    window.open(intents().facebook, "_blank", "noopener,noreferrer,width=600,height=600")
  }

  // ── Instagram ─────────────────────────────────────────────────────────────

  async function handleInstagram() {
    const { instagram, shareUrl } = intents()
    window.location.href = instagram
    await new Promise((r) => setTimeout(r, 1200))
    await copyToClipboard(shareUrl)
    toast.success("Link copied for Instagram!", {
      description: "Add it to your bio link, story, or post caption.",
    })
  }

  // ── Teams ─────────────────────────────────────────────────────────────────

  function handleTeams() {
    window.open(intents().teams, "_blank", "noopener,noreferrer,width=700,height=560")
  }

  // ── Slack ─────────────────────────────────────────────────────────────────

  async function handleSlack() {
    const { slack, shareUrl } = intents()
    window.location.href = slack
    await new Promise((r) => setTimeout(r, 1200))
    await copyToClipboard(shareUrl)
    toast.success("Link copied for Slack!", { description: "Paste it into any channel or DM." })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Primary row: Copy + native share */}
      <div className="flex flex-wrap gap-2">
        <ShareBtn onClick={handleCopy} label="Copy share link" active={copied}>
          {copied
            ? <Check className="h-4 w-4" aria-hidden="true" />
            : <Link2 className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied!" : "Copy link"}
        </ShareBtn>

        {canNativeShare && (
          <ShareBtn onClick={handleNativeShare} label="Share via system sheet">
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share
          </ShareBtn>
        )}
      </div>

      {/* Social + workplace row */}
      <div className="flex flex-wrap gap-2">
        <ShareBtn onClick={handleLinkedIn} label="Share on LinkedIn">
          <LinkedInIcon className="h-4 w-4 text-[#0a66c2]" />
          LinkedIn
        </ShareBtn>

        <ShareBtn onClick={handleFacebook} label="Share on Facebook">
          <FacebookIcon className="h-4 w-4 text-[#1877f2]" />
          Facebook
        </ShareBtn>

        <ShareBtn onClick={handleInstagram} label="Share to Instagram">
          <InstagramIcon className="h-4 w-4 text-[#e1306c]" />
          Instagram
        </ShareBtn>

        <ShareBtn onClick={handleTeams} label="Post to Microsoft Teams">
          <TeamsIcon className="h-4 w-4 text-[#6264a7]" />
          Teams
        </ShareBtn>

        <ShareBtn onClick={handleSlack} label="Post to Slack">
          <SlackIcon className="h-4 w-4" />
          Slack
        </ShareBtn>
      </div>
    </div>
  )
}
