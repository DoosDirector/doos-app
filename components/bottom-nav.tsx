"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Home",   icon: Home },
  { href: "/events/create", label: "Create", icon: PlusCircle },
  { href: "/profile",     label: "Profile", icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 md:hidden",
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        // Safe area for notched phones
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <ul className="flex h-16 items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            // Keep "Home" active for all /dashboard/* paths
            // Keep "Create" only active on the exact create page
            (href !== "/events/create" && pathname.startsWith(href + "/"))

          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                prefetch
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5",
                  "text-xs font-medium transition-colors duration-150",
                  active ? "text-brand-primary" : "text-muted-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                {/* Active indicator pill above icon */}
                <span
                  className={cn(
                    "absolute top-1.5 h-1 w-8 rounded-full transition-all duration-200",
                    active ? "bg-brand-primary opacity-100" : "opacity-0"
                  )}
                  aria-hidden="true"
                />

                <Icon
                  className={cn(
                    "mt-1 h-5 w-5 transition-transform duration-150",
                    active ? "scale-110 stroke-[2.5]" : "stroke-2"
                  )}
                  aria-hidden="true"
                />
                <span className={cn(active ? "font-semibold" : "font-normal")}>
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
