'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Factory,
  MapPin,
  Package,
  Ship,
  Shirt,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type MapPinData = {
  id: string;
  label: string;
  city: string;
  country: string;
  kind: 'facility' | 'port' | 'brand' | 'partner';
  status?: string;
  /** 0–100 position on stylized map */
  x: number;
  y: number;
};

export type JourneyStep = {
  id: string;
  label: string;
  place: string;
  date?: string;
  done?: boolean;
};

export type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  href?: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
};

type InteractiveOverviewProps = {
  pins: MapPinData[];
  journey: JourneyStep[];
  activity: ActivityItem[];
  passport?: {
    name: string;
    sku: string;
    status: string;
    href: string;
    materials?: string;
  } | null;
};

const kindIcon = {
  facility: Factory,
  port: Ship,
  brand: Building2,
  partner: Package,
} as const;

export function InteractiveOverview({
  pins,
  journey,
  activity,
  passport,
}: InteractiveOverviewProps) {
  const [activeId, setActiveId] = useState<string | null>(pins[0]?.id ?? null);
  const active = useMemo(
    () => pins.find((p) => p.id === activeId) ?? pins[0] ?? null,
    [activeId, pins]
  );

  return (
    <div className="grid gap-3.5 xl:grid-cols-[1.45fr_1fr]">
      {/* Map */}
      <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[13.5px] font-bold text-stt-ink">Supply chain map</h3>
          <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
            {pins.length} nodes
          </Badge>
        </div>
        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#EAF3FB_0%,#F7FAFD_55%,#EEF6F1_100%)] px-3 pb-3 pt-3">
          <svg
            viewBox="0 0 640 280"
            className="h-[240px] w-full"
            role="img"
            aria-label="Interactive supply chain map"
          >
            {/* soft continents (stylized) */}
            <ellipse cx="160" cy="130" rx="90" ry="55" fill="#D7E6F4" opacity="0.9" />
            <ellipse cx="310" cy="150" rx="70" ry="48" fill="#D7E6F4" opacity="0.85" />
            <ellipse cx="470" cy="110" rx="100" ry="60" fill="#D7E6F4" opacity="0.9" />
            <ellipse cx="520" cy="190" rx="55" ry="35" fill="#D7E6F4" opacity="0.7" />

            {/* route path */}
            {pins.length >= 2 ? (
              <path
                d={buildRoutePath(pins)}
                fill="none"
                stroke="#12A45B"
                strokeWidth="2.5"
                strokeDasharray="6 5"
                opacity="0.85"
              />
            ) : null}

            {pins.map((pin) => {
              const selected = active?.id === pin.id;
              const Icon = kindIcon[pin.kind];
              return (
                <g
                  key={pin.id}
                  transform={`translate(${(pin.x / 100) * 640}, ${(pin.y / 100) * 280})`}
                  className="cursor-pointer"
                  onClick={() => setActiveId(pin.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveId(pin.id);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={pin.label}
                >
                  <circle
                    r={selected ? 16 : 12}
                    fill={selected ? '#12A45B' : '#FFFFFF'}
                    stroke={selected ? '#0B7A42' : '#12A45B'}
                    strokeWidth="2"
                  />
                  <foreignObject x={-7} y={-7} width="14" height="14">
                    <div className="grid size-full place-items-center">
                      <Icon
                        className={cn(
                          'size-3',
                          selected ? 'text-white' : 'text-stt-green'
                        )}
                        strokeWidth={2}
                      />
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {active ? (
            <div className="absolute bottom-4 left-4 right-4 rounded-[10px] border border-stt-line bg-white/95 p-3 shadow-[var(--stt-shadow)] backdrop-blur sm:right-auto sm:w-[280px]">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 text-stt-green" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-stt-ink">
                    {active.label}
                  </div>
                  <div className="text-[12px] text-stt-muted">
                    {active.city}
                    {active.country ? `, ${active.country}` : ''}
                  </div>
                  {active.status ? (
                    <Badge className="mt-1.5 rounded-full bg-stt-green-soft text-[10px] text-stt-green-dark">
                      {active.status}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <Link
                href="/supply-chain"
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-stt-blue hover:underline"
              >
                View details <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-3 px-1 text-[11px] text-stt-muted">
            {(
              [
                ['Facility', Factory],
                ['Port', Ship],
                ['Brand', Building2],
                ['Partner', Package],
              ] as const
            ).map(([label, Icon]) => (
              <span key={label} className="inline-flex items-center gap-1">
                <Icon className="size-3 text-stt-green" strokeWidth={1.75} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-3.5">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[13.5px] font-bold">Recent activity</h3>
          </div>
          <ul className="divide-y divide-stt-line">
            {activity.length === 0 ? (
              <li className="px-4 py-6 text-[12.5px] text-stt-muted">No recent events.</li>
            ) : (
              activity.slice(0, 5).map((a) => (
                <li key={a.id} className="px-4 py-2.5">
                  {a.href ? (
                    <Link href={a.href} className="block hover:opacity-90">
                      <ActivityRow item={a} />
                    </Link>
                  ) : (
                    <ActivityRow item={a} />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>

        {passport ? (
          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <div className="flex items-center gap-2">
              <Shirt className="size-4 text-stt-green" strokeWidth={1.75} />
              <h3 className="text-[13.5px] font-bold">Product passport</h3>
            </div>
            <div className="mt-2 font-display text-[16px] font-bold text-stt-ink">
              {passport.name}
            </div>
            <div className="mt-0.5 font-mono-stt text-[12px] text-stt-muted">
              {passport.sku}
            </div>
            {passport.materials ? (
              <p className="mt-2 text-[12.5px] text-stt-muted">{passport.materials}</p>
            ) : null}
            <div className="mt-3 flex items-center gap-2">
              <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="size-3" strokeWidth={1.75} />
                  {passport.status}
                </span>
              </Badge>
              <Link
                href={passport.href}
                className="text-[12px] font-semibold text-stt-blue hover:underline"
              >
                Open →
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* Journey full width */}
      <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)] xl:col-span-2">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[13.5px] font-bold">Product traceability journey</h3>
          <Link
            href="/dpp"
            className="ml-auto text-[12px] font-semibold text-stt-blue hover:underline"
          >
            Passports
          </Link>
        </div>
        <div className="overflow-x-auto px-4 py-4">
          <div className="flex min-w-max items-start gap-0">
            {journey.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div className="w-[118px] text-center">
                  <div
                    className={cn(
                      'mx-auto grid size-9 place-items-center rounded-full border-2',
                      step.done
                        ? 'border-stt-green bg-stt-green-soft text-stt-green-dark'
                        : 'border-stt-line bg-white text-stt-faint'
                    )}
                  >
                    <Package className="size-4" strokeWidth={1.75} />
                  </div>
                  <div className="mt-2 text-[12px] font-bold text-stt-ink">{step.label}</div>
                  <div className="text-[11px] text-stt-muted">{step.place}</div>
                  {step.date ? (
                    <div className="mt-0.5 font-mono-stt text-[10px] text-stt-faint">
                      {step.date}
                    </div>
                  ) : null}
                </div>
                {i < journey.length - 1 ? (
                  <div className="mb-8 w-6 text-stt-green">
                    <ArrowRight className="size-4" strokeWidth={1.75} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const tone =
    item.tone === 'danger'
      ? 'bg-stt-red'
      : item.tone === 'warning'
        ? 'bg-stt-amber'
        : item.tone === 'success'
          ? 'bg-stt-green'
          : 'bg-stt-blue';
  return (
    <div className="flex items-start gap-2.5">
      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', tone)} />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-stt-ink">{item.title}</div>
        <div className="text-[11.5px] text-stt-muted">{item.meta}</div>
      </div>
    </div>
  );
}

function buildRoutePath(pins: MapPinData[]): string {
  const pts = pins.map((p) => [(p.x / 100) * 640, (p.y / 100) * 280] as const);
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    const cy = Math.min(y0, y1) - 28;
    d += ` Q ${cx} ${cy} ${x1} ${y1}`;
  }
  return d;
}
