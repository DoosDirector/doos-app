import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

/**
 * Server client for use in Server Components, Route Handlers, and Server
 * Actions. Creates a new instance per call — never share across requests.
 *
 * Pass `readonly: true` when you only need to read data and don't need the
 * client to refresh the session cookie (e.g. deeply nested Server Components).
 */
export async function createClient(readonly = false) {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          if (readonly) return
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll called from a Server Component — session refresh will be
            // handled by middleware so this is safe to ignore.
          }
        },
      },
    }
  )
}
