// ── Share intent URL builder ──────────────────────────────────────────────────

export type ShareIntentInput = {
  shareToken:   string
  eventTitle?:  string
  memoryTeaser?: string  // e.g. "Check out the memories from our night out!"
  baseUrl?:     string   // defaults to window.location.origin at call time
}

export type ShareIntents = {
  shareUrl:  string
  message:   string
  linkedin:  string
  facebook:  string
  instagram: string   // deep link (app only); caller should clipboard-fallback
  teams:     string
  slack:     string
  whatsapp:  string
}

/**
 * Builds platform-specific share intent URLs for a Doo event.
 * `baseUrl` must be passed in server contexts; in the browser it defaults
 * to `window.location.origin`.
 */
export function buildShareIntents(input: ShareIntentInput): ShareIntents {
  const {
    shareToken,
    eventTitle,
    memoryTeaser,
    baseUrl = typeof window !== "undefined" ? window.location.origin : "",
  } = input

  const shareUrl = `${baseUrl}/e/${shareToken}`

  // Compose a human-readable message
  const headline = eventTitle ? `${eventTitle}` : "A Doo event"
  const teaser   = memoryTeaser ? ` · ${memoryTeaser}` : ""
  const message  = `${headline}${teaser} — join on Doo's: ${shareUrl}`
  const shortMsg = eventTitle
    ? `${eventTitle} — join on Doo's`
    : "Join my Doo!"

  return {
    shareUrl,
    message,

    // LinkedIn: official share-offsite endpoint (no app ID needed)
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`,

    // Facebook: standard sharer endpoint
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`,

    // Instagram: no web share URL — app deep link only; falls back to clipboard
    instagram: `instagram://share?url=${enc(shareUrl)}`,

    // Microsoft Teams: official Share-to-Teams URL with link preview
    teams:
      `https://teams.microsoft.com/share` +
      `?href=${enc(shareUrl)}` +
      `&preview=true` +
      (eventTitle ? `&title=${enc(eventTitle)}` : ""),

    // Slack: app deep link with pre-filled message; falls back to clipboard
    slack: `slack://open?message=${enc(shortMsg + " " + shareUrl)}`,

    // WhatsApp: wa.me share URL
    whatsapp: `https://wa.me/?text=${enc(message)}`,
  }
}

function enc(s: string) {
  return encodeURIComponent(s)
}
