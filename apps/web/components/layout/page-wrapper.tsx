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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} description={description} actions={actions} />
        <main className={cn('flex-1 px-6 py-6', className)}>{children}</main>
      </div>
    </div>
  );
}
