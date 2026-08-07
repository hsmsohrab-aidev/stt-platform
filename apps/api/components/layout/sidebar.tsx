'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  badge?: number;
};

const operate: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/brand', label: 'Brand hub' },
  { href: '/supplier', label: 'Supplier hub' },
  { href: '/auditor', label: 'Auditor hub' },
  { href: '/orders', label: 'Orders' },
  { href: '/shipments', label: 'Shipments' },
  { href: '/materials', label: 'Materials' },
  { href: '/wallet', label: 'Material Wallet' },
  { href: '/tc', label: 'TC Certificates' },
  { href: '/dpp', label: 'Product Passport' },
  { href: '/verification', label: 'Verification' },
  { href: '/facilities', label: 'Facilities' },
  { href: '/supply-chain', label: 'Supply Chain' },
];

const assure: NavItem[] = [
  { href: '/risk', label: 'Risk Hub' },
  { href: '/compliance', label: 'Compliance' },
  { href: '/sustainability', label: 'Sustainability' },
];

const decide: NavItem[] = [
  { href: '/reports', label: 'Reports' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/membership', label: 'Membership' },
];

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="mt-1">
      <p className="px-2.5 pb-1 pt-3 text-[9px] font-medium uppercase tracking-[1.5px] text-[#5D7189]">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'relative z-10 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition',
                active
                  ? 'bg-stt-green text-white'
                  : 'text-[#A9BCD1] hover:bg-white/10 hover:text-white'
              )}
            >
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-stt-red px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

type SidebarProps = {
  className?: string;
};

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'relative z-20 flex w-[198px] shrink-0 flex-col overflow-y-auto bg-stt-navy px-2.5 py-3.5',
        className
      )}
    >
      <div className="px-2.5 pb-3.5 font-display text-[17px] font-extrabold tracking-wide text-white">
        S<span className="text-stt-green">TT</span>
      </div>
      <NavSection title="Operate" items={operate} pathname={pathname} />
      <NavSection title="Assure" items={assure} pathname={pathname} />
      <NavSection title="Decide" items={decide} pathname={pathname} />
    </aside>
  );
}
