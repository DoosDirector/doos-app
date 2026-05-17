import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

// Routes that require the user to be signed in
const PROTECTED_PREFIXES = ["/dashboard", "/events"]

// Routes that signed-in users should not be able to reach
const AUTH_ROUTES = ["/auth/sign-in", "/auth/sign-up"]

export async function middleware(request: NextRequest) {
  // Start with a response we can mutate (to forward refreshed session cookies)
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies to the outgoing request (so Server Components see them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recreate response with the mutated request so cookies are forwarded
          supabaseResponse = NextResponse.next({ request })
          // Write the same cookies to the response (so the browser stores them)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: use getUser() not getSession() — getSession() is unverified.
  // This makes a network call to Supabase Auth on every request, which also
  // refreshes the session token when it is near expiry.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect unauthenticated users away from protected routes
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/sign-in"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect signed-in users away from auth pages to the dashboard
  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: return supabaseResponse (not a plain NextResponse.next()) so
  // that the refreshed session cookies are forwarded to the browser.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     *   - _next/static  (static files)
     *   - _next/image   (Next.js image optimisation)
     *   - favicon.ico   (browser default request)
     *   - public assets (svg, png, jpg, webp, ico, manifest)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
}
