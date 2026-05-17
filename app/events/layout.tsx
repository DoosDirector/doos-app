import { requireUser } from "@/lib/auth/guard"

export default async function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireUser()
  return <>{children}</>
}
