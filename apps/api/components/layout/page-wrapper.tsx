import { Header } from '@/components/layout/header';
import { AppShell } from '@/components/layout/app-shell';
import { getUnreadNotificationCount } from '@/lib/notifications/load';
import { cn } from '@/lib/utils';

type PageWrapperProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** When true, wraps with Sidebar (invite outside dashboard layout). */
  standalone?: boolean;
  /** Onboarding before org exists — no sidebar (nav would bounce back here). */
  bare?: boolean;
};

export async function PageWrapper({
  title,
  description,
  actions,
  children,
  className,
  standalone = false,
  bare = false,
}: PageWrapperProps) {
  const unread = bare ? 0 : await getUnreadNotificationCount();

  const body = (
    <>
      <Header
        title={title}
        description={description}
        actions={actions}
        unreadCount={unread}
      />
      <main className={cn('flex-1 overflow-y-auto px-4 py-4 pb-10', className)}>
        {children}
      </main>
    </>
  );

  if (bare) {
    return <div className="flex min-h-screen flex-col bg-stt-bg">{body}</div>;
  }
  if (standalone) return <AppShell>{body}</AppShell>;
  return body;
}
