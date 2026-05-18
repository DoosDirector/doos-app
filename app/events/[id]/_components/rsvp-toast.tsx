"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

export function RsvpToast() {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    toast.success("RSVP saved!", {
      description: "Your attendance has been recorded.",
    })
    router.replace(pathname)
  }, [router, pathname])

  return null
}
