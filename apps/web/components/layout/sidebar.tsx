import Link from 'next/link';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/brand', label: 'Brand' },
  { href: '/supplier', label: 'Supplier' },
  { href: '/auditor', label: 'Auditor' },
];

type SidebarProps = {
  className?: string;
};

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground',
        className
      )}
    >
      <div className="border-b border-sidebar-border px-5 py-5">
        <p className="text-xs uppercase tracking-[0.2em] text-sidebar-primary">
          STT
        </p>
        <p className="mt-1 text-sm font-semibold">Platform</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
