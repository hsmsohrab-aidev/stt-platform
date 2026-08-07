import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

type HeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  unreadCount?: number;
  className?: string;
};

export function Header({
  title,
  description,
  actions,
  unreadCount = 0,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'flex h-[56px] shrink-0 items-center gap-3 border-b border-stt-line bg-stt-card px-4',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[17px] font-bold tracking-tight text-stt-ink">
          {title}
        </h1>
        {description ? (
          <p className="truncate text-[12.5px] text-stt-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      <Link
        href="/alerts"
        className="relative grid size-[36px] place-items-center rounded-[9px] border border-stt-line text-stt-muted hover:bg-[#F8FAFC] hover:text-stt-ink"
        aria-label="Alerts"
      >
        <Bell className="size-[16px]" strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-stt-red px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Link>
      <div className="grid size-8 place-items-center rounded-full bg-stt-green text-[11px] font-bold text-white">
        ST
      </div>
    </header>
  );
}
