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
        'flex flex-wrap items-start justify-between gap-4 border-b border-border bg-card px-6 py-4',
        className
      )}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
