"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

export function CreatedToast() {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    toast.success("Doo created!", {
      description: "Share the link with your team to get RSVPs and votes.",
    })
    // Remove ?created=1 from the URL without adding a history entry
    router.replace(pathname)
  }, [router, pathname])

  return null
}
