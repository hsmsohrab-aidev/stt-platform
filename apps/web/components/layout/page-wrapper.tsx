import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

type PageWrapperProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function PageWrapper({
  title,
  description,
  actions,
  children,
  className,
}: PageWrapperProps) {
  return (
    <div className="flex min-h-screen bg-stt-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} description={description} actions={actions} />
        <main className={cn('flex-1 overflow-y-auto px-4 py-4 pb-10', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
