import Link from "next/link"
import Image from "next/image"
import { LogOut, LayoutDashboard, PlusCircle, User } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/lib/actions/auth"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"

// ── User avatar ───────────────────────────────────────────────────────────────

function Avatar({
  src,
  name,
  size = 32,
}: {
  src: string | null
  name: string | null
  size?: number
}) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?"

  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? "User avatar"}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-brand-primary/20"
      />
    )
  }

  return (
    <span
      className="flex items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white ring-2 ring-brand-primary/20"
      style={{ width: size, height: size }}
      aria-label={name ?? "User"}
    >
      {initials}
    </span>
  )
}

// ── Desktop sidebar nav item ──────────────────────────────────────────────────

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ElementType
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {label}
    </Link>
  )
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch profile for display name and avatar
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single()
    : { data: null }

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-screen-lg items-center justify-between px-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="Doo's home">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <span className="hidden text-lg font-bold text-foreground sm:block">
              Doo&apos;s
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Desktop navigation">
            <NavLink href="/dashboard"    icon={LayoutDashboard} label="Dashboard" />
            <NavLink href="/events/create" icon={PlusCircle}      label="Create event" />
            <NavLink href="/profile"      icon={User}             label="Profile" />
          </nav>

          {/* User section */}
          <div className="flex items-center gap-3">
            <Link href="/profile" aria-label="Your profile" className="shrink-0">
              <Avatar
                src={profile?.avatar_url ?? null}
                name={profile?.display_name ?? null}
              />
            </Link>

            {/* Sign-out form — works without JS */}
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main id="main-content" className="mx-auto w-full max-w-screen-lg flex-1 px-4 pb-20 pt-6 md:pb-6">
        {children}
      </main>

      {/* ── Mobile bottom nav (Client Component for active state) ────────── */}
      <BottomNav />
    </div>
  )
}
