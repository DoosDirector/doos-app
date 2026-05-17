import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get("code")
  // `next` is set by our OAuth redirect in sign-in-form.tsx; fall back to dashboard
  const next = searchParams.get("next") ?? "/dashboard"

  // Reject obviously open-redirect attempts – only allow relative paths
  const safeNext = next.startsWith("/") ? next : "/dashboard"

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=missing_code`
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message)
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`
    )
  }

  // Session established – redirect to the originally requested page
  return NextResponse.redirect(`${origin}${safeNext}`)
}
