import { Sidebar } from '@/components/layout/sidebar';

/** Persistent dashboard chrome — lives in layout so Sidebar survives navigations. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-stt-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
