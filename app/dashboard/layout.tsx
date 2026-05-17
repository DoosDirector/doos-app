import { AppShell } from "@/components/app-shell"
import { requireUser } from "@/lib/auth/guard"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireUser()
  return <AppShell>{children}</AppShell>
}
