import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ClipboardCheck,
  Factory,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type HubTone = 'exec' | 'brand' | 'supplier' | 'auditor';

const TONE: Record<
  HubTone,
  {
    Icon: LucideIcon;
    eyebrow: string;
    shell: string;
    iconWrap: string;
    chip: string;
  }
> = {
  exec: {
    Icon: LayoutDashboard,
    eyebrow: 'Executive overview',
    shell: 'border-[#B8D4F0] bg-[linear-gradient(135deg,#0E2A47_0%,#163A5C_55%,#1E4A6E_100%)] text-white',
    iconWrap: 'bg-white/15 text-white',
    chip: 'border-white/25 bg-white/10 text-white hover:bg-white/20',
  },
  brand: {
    Icon: Building2,
    eyebrow: 'Buyer · brand workspace',
    shell:
      'border-[#C8EBD6] bg-[linear-gradient(135deg,#E8F6EF_0%,#F4FBF7_50%,#FFFFFF_100%)] text-stt-ink',
    iconWrap: 'bg-stt-green text-white',
    chip: 'border-stt-green/30 bg-white text-stt-green-dark hover:border-stt-green',
  },
  supplier: {
    Icon: Factory,
    eyebrow: 'Factory · supplier floor',
    shell:
      'border-[#F0D9A8] bg-[linear-gradient(135deg,#FFF6E8_0%,#FFFBF3_45%,#FFFFFF_100%)] text-stt-ink',
    iconWrap: 'bg-stt-amber text-white',
    chip: 'border-stt-amber/40 bg-white text-stt-amber hover:border-stt-amber',
  },
  auditor: {
    Icon: ClipboardCheck,
    eyebrow: 'Trust · auditor desk',
    shell:
      'border-[#D9C8F0] bg-[linear-gradient(135deg,#F3EDFA_0%,#FAF7FD_50%,#FFFFFF_100%)] text-stt-ink',
    iconWrap: 'bg-stt-purple text-white',
    chip: 'border-stt-purple/35 bg-white text-stt-purple hover:border-stt-purple',
  },
};

type HubBannerProps = {
  tone: HubTone;
  title: string;
  subtitle: string;
  links?: Array<{ href: string; label: string }>;
  stats?: Array<{ label: string; value: string | number }>;
};

/** Role-colored hero so hubs are not visually interchangeable. */
export function HubBanner({
  tone,
  title,
  subtitle,
  links = [],
  stats = [],
}: HubBannerProps) {
  const t = TONE[tone];
  const Icon = t.Icon;
  const onDark = tone === 'exec';

  return (
    <section
      className={cn(
        'mb-3.5 overflow-hidden rounded-2xl border px-5 py-5 shadow-[var(--stt-shadow)]',
        t.shell
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-xl',
            t.iconWrap
          )}
        >
          <Icon className="size-6" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[10px] font-bold uppercase tracking-[1.4px]',
              onDark ? 'text-[#9EC5E8]' : 'text-stt-faint'
            )}
          >
            {t.eyebrow}
          </p>
          <h2
            className={cn(
              'mt-1 font-display text-[22px] font-bold leading-tight',
              onDark ? 'text-white' : 'text-stt-navy'
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              'mt-1 max-w-xl text-[12.5px] leading-relaxed',
              onDark ? 'text-white/75' : 'text-stt-muted'
            )}
          >
            {subtitle}
          </p>
          {links.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
                    t.chip
                  )}
                >
                  {l.label}
                  <ArrowRight className="size-3" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        {stats.length > 0 ? (
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {stats.map((s) => (
              <div
                key={s.label}
                className={cn(
                  'min-w-[88px] rounded-xl border px-3 py-2',
                  onDark
                    ? 'border-white/20 bg-white/10'
                    : 'border-stt-line/80 bg-white/80'
                )}
              >
                <div
                  className={cn(
                    'text-[9.5px] font-semibold uppercase tracking-wide',
                    onDark ? 'text-white/60' : 'text-stt-faint'
                  )}
                >
                  {s.label}
                </div>
                <div
                  className={cn(
                    'font-display text-[18px] font-bold',
                    onDark ? 'text-white' : 'text-stt-ink'
                  )}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
