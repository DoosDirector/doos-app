import type { Metadata } from "next"
import { SignInForm } from "./sign-in-form"

export const metadata: Metadata = {
  title: "Sign in – Doo's",
  description: "Sign in to your Doo's account to organise and join team events.",
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo } = await searchParams

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <SignInForm redirectTo={redirectTo} />

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to Doo&apos;s{" "}
        <a href="#" className="underline hover:text-foreground">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
      </p>
    </main>
  )
}
