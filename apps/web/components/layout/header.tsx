import { cn } from '@/lib/utils';

type HeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function Header({ title, description, actions, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'flex h-[52px] shrink-0 items-center gap-3 border-b border-stt-line bg-stt-card px-4',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[15.5px] font-bold tracking-tight text-stt-ink">
          {title}
        </h1>
        {description ? (
          <p className="truncate text-[11.5px] text-stt-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      <div className="hidden items-center gap-1.5 rounded-lg border border-stt-line bg-white px-2.5 py-1.5 text-[11.5px] text-stt-muted sm:flex">
        Jul 06 – Jul 12, 2026
      </div>
      <div className="relative grid size-[34px] place-items-center rounded-[9px] border border-stt-line text-sm">
        <span aria-hidden>🔔</span>
        <span className="absolute -right-1 -top-1 rounded-full bg-stt-red px-1 text-[8.5px] font-bold text-white">
          5
        </span>
      </div>
      <div className="grid size-8 place-items-center rounded-full bg-stt-green text-[11px] font-bold text-white">
        ST
      </div>
    </header>
  );
}
