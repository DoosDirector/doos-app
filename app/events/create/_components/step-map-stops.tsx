"use client"

import { MapPin } from "lucide-react"

export function StepMapStops() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10">
        <MapPin className="h-7 w-7 text-brand-primary" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">Map stops</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Google Maps integration coming soon. You&apos;ll be able to add venues and
          plan a route for your Doo.
        </p>
      </div>
    </div>
  )
}
