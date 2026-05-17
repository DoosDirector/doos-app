import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

/**
 * Returns the verified Supabase user or redirects to /auth/sign-in.
 *
 * Use at the top of any Server Component page or layout that requires auth.
 * Middleware (middleware.ts) already handles the redirect at the edge, but
 * this guard provides a typed user object and a second line of defence for
 * any paths the middleware matcher might miss.
 *
 * Usage:
 *   const user = await requireUser()
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/sign-in")
  }

  return user
}

/**
 * Returns the verified user or null — does not redirect.
 * Useful for layouts that render differently for auth vs. anon users.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
