import { AppShell } from "@/components/app-shell"
import { requireUser } from "@/lib/auth/guard"

export default async function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireUser()
  return <AppShell>{children}</AppShell>
}
