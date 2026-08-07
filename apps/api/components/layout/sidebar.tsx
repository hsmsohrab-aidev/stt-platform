'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Building2,
  Factory,
  ShieldCheck,
  ShoppingCart,
  Ship,
  Layers,
  Wallet,
  FileBadge2,
  QrCode,
  ClipboardCheck,
  Warehouse,
  GitBranch,
  TriangleAlert,
  Scale,
  Leaf,
  BarChart3,
  Bell,
  Users,
  Database,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

const operate: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/brand', label: 'Brand hub', icon: Building2 },
  { href: '/supplier', label: 'Supplier hub', icon: Factory },
  { href: '/auditor', label: 'Auditor hub', icon: ShieldCheck },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/shipments', label: 'Shipments', icon: Ship },
  { href: '/materials', label: 'Materials', icon: Layers },
  { href: '/wallet', label: 'Material Wallet', icon: Wallet },
  { href: '/tc', label: 'TC Certificates', icon: FileBadge2 },
  { href: '/dpp', label: 'Product Passport', icon: QrCode },
  { href: '/verification', label: 'Verification', icon: ClipboardCheck },
  { href: '/facilities', label: 'Facilities', icon: Warehouse },
  { href: '/supply-chain', label: 'Supply Chain', icon: GitBranch },
];

const assure: NavItem[] = [
  { href: '/risk', label: 'Risk Hub', icon: TriangleAlert },
  { href: '/compliance', label: 'Compliance', icon: Scale },
  { href: '/sustainability', label: 'Sustainability', icon: Leaf },
];

const decide: NavItem[] = [
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/membership', label: 'Membership', icon: Users },
];

const demoData: NavItem = {
  href: '/demo-data',
  label: 'Demo Data',
  icon: Database,
};

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
      <p className="px-2.5 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[1.5px] text-[#5D7189]">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'relative z-10 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition',
                active
                  ? 'bg-stt-green text-white'
                  : 'text-[#A9BCD1] hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'size-[16px] shrink-0',
                  active ? 'text-white' : 'text-[#7E96B0]'
                )}
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="flex-1 truncate">{item.label}</span>
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
  const DemoIcon = demoData.icon;
  const demoActive = pathname.startsWith(demoData.href);

  return (
    <aside
      className={cn(
        'relative z-20 flex w-[220px] shrink-0 flex-col overflow-y-auto bg-stt-navy px-2.5 py-3.5',
        className
      )}
    >
      <div className="px-1.5 pb-3.5">
        <Link href="/" prefetch={false} className="block">
          <BrandLogo tone="light" size="md" withTagline />
        </Link>
      </div>
      <NavSection title="Operate" items={operate} pathname={pathname} />
      <NavSection title="Assure" items={assure} pathname={pathname} />
      <NavSection title="Decide" items={decide} pathname={pathname} />

      <div className="mt-auto border-t border-white/10 pt-2">
        <Link
          href={demoData.href}
          prefetch={false}
          className={cn(
            'relative z-10 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition',
            demoActive
              ? 'bg-stt-green text-white'
              : 'text-[#A9BCD1] hover:bg-white/10 hover:text-white'
          )}
        >
          <DemoIcon
            className={cn(
              'size-[16px] shrink-0',
              demoActive ? 'text-white' : 'text-[#7E96B0]'
            )}
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="flex-1">{demoData.label}</span>
        </Link>
      </div>
    </aside>
  );
}
