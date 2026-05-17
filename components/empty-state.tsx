import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export type EmptyStateProps = {
  icon: LucideIcon
  heading: string
  description: string
  action?: {
    label: string
    href: string
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  heading,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card",
        "px-6 py-16 text-center",
        className
      )}
    >
      {/* Icon badge */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
        <Icon className="h-8 w-8 text-brand-primary" aria-hidden="true" />
      </div>

      <h2 className="mb-2 text-lg font-semibold text-foreground">{heading}</h2>
      <p className="mb-7 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {action && (
        <Button asChild size="lg" className="shadow-sm">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  )
}
