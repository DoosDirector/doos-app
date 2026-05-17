"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, PlusCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events/create", label: "Create",    icon: PlusCircle },
  { href: "/profile",    label: "Profile",    icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden"
    >
      <ul className="flex h-16 items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
                  active
                    ? "text-brand-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn("h-5 w-5", active && "stroke-[2.5]")}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
