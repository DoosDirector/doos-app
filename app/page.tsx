import Link from "next/link"
import { CalendarDays, MapPin, BarChart2, Camera } from "lucide-react"

const FEATURES = [
  { icon: BarChart2,  title: "Polls",       description: "Vote on venues, times, and activities." },
  { icon: MapPin,     title: "Route map",   description: "Plan your stops with a live map." },
  { icon: CalendarDays, title: "RSVPs",     description: "See who's coming at a glance." },
  { icon: Camera,     title: "Memory Box",  description: "Share photos and videos after the event." },
]

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-primary/10 to-background px-4 py-12">
      {/* Logo + wordmark */}
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary shadow-lg">
        <span className="text-3xl font-bold text-white">D</span>
      </div>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground">Doo&apos;s</h1>
      <p className="mt-2 text-center text-lg font-medium text-muted-foreground">
        Team Events Made Easy
      </p>

      {/* Tagline */}
      <p className="mt-4 max-w-sm text-center text-sm text-muted-foreground">
        Organise nights out, lunches, and activities with polls, maps, RSVPs, and a shared Memory Box.
      </p>

      {/* CTA */}
      <Link
        href="/auth/sign-in"
        className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-brand-primary px-8 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Get started — it&apos;s free
      </Link>

      {/* Feature grid */}
      <div className="mt-12 grid w-full max-w-lg grid-cols-2 gap-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-xl border bg-card p-4 shadow-sm">
            <Icon className="h-5 w-5 text-brand-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
