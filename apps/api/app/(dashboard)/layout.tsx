import { AppShell } from '@/components/layout/app-shell';
import { requireSessionContext } from '@/lib/auth/session';

/**
 * Org gate + persistent shell for authenticated app routes.
 * Session is React-cached — child pages reuse requireSessionContext().
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSessionContext();
  return <AppShell>{children}</AppShell>;
}
