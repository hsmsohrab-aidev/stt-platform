'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ChainNode } from '@/lib/dashboard/supply-chain';
import {
  ArrowRight,
  Building2,
  Droplets,
  Factory,
  GitBranch,
  Package,
  Scissors,
  Shirt,
  Sprout,
  Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TIER_LABEL: Record<string, string> = {
  tier_6: 'Tier 6 · Raw',
  tier_5: 'Tier 5 · Spin',
  tier_4: 'Tier 4 · Knit',
  tier_3: 'Tier 3 · Dye',
  tier_2: 'Tier 2 · Fabric',
  tier_1: 'Tier 1 · Garment',
  brand: 'Brand / Retail',
  org: 'Organization',
};

const TIER_ICON: Record<string, LucideIcon> = {
  tier_6: Sprout,
  tier_5: Package,
  tier_4: Scissors,
  tier_3: Droplets,
  tier_2: Factory,
  tier_1: Shirt,
  brand: Building2,
  org: Warehouse,
};

function nodeHref(node: ChainNode): string {
  if (node.href) return node.href;
  if (node.isBrand) return '/brand';
  if (node.facilityId) return `/facilities/${node.facilityId}`;
  if (node.tier === 'org') return '/facilities';
  return '/supplier';
}

export function SupplyChainMap({ nodes }: { nodes: ChainNode[] }) {
  const [active, setActive] = useState(0);

  if (nodes.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[13px] text-stt-muted">
        No chain nodes yet. Link suppliers from Brand Hub or declare facilities.
      </p>
    );
  }

  const selected = nodes[Math.min(active, nodes.length - 1)];

  return (
    <div className="px-4 py-5">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-stretch gap-0">
          {nodes.map((node, index) => {
            const Icon = TIER_ICON[node.tier] ?? GitBranch;
            const isActive = index === active;
            return (
              <div key={`${node.orgId}-${node.title}-${index}`} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className={cn(
                    'w-[160px] rounded-xl border px-3 py-3 text-left transition',
                    isActive
                      ? 'border-stt-green bg-stt-green-soft shadow-[var(--stt-shadow)]'
                      : node.isBrand
                        ? 'border-stt-green/50 bg-white'
                        : 'border-stt-line bg-white hover:border-stt-green/40'
                  )}
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-stt-green-soft text-stt-green-dark">
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-stt-faint">
                    {TIER_LABEL[node.tier] ?? node.tier}
                  </div>
                  <div className="mt-0.5 text-[13px] font-bold leading-snug text-stt-ink">
                    {node.title}
                  </div>
                  <div className="mt-1 text-[11px] text-stt-muted">{node.subtitle}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {node.facilityCount > 0 ? (
                      <Badge className="rounded-full bg-[#EDF1F6] text-[9px] text-stt-muted">
                        {node.facilityCount} fac
                      </Badge>
                    ) : null}
                    {node.latestTc ? (
                      <Badge className="font-mono-stt rounded-full bg-stt-blue-soft text-[9px] text-stt-blue">
                        {node.latestTc}
                      </Badge>
                    ) : null}
                  </div>
                </button>
                {index < nodes.length - 1 ? (
                  <div className="mx-1 flex w-6 items-center justify-center text-stt-green">
                    <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-stt-line bg-[#F8FAFC] px-4 py-3">
          <div>
            <div className="text-[13px] font-bold text-stt-ink">{selected.title}</div>
            <div className="text-[12px] text-stt-muted">
              {TIER_LABEL[selected.tier] ?? selected.tier}
              {selected.subtitle ? ` · ${selected.subtitle}` : ''}
              {selected.facilityCount > 0
                ? ` · ${selected.facilityCount} facilities`
                : ''}
              {selected.latestTc ? ` · latest TC ${selected.latestTc}` : ''}
            </div>
          </div>
          <Link
            href={nodeHref(selected)}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-stt-blue hover:underline"
          >
            Open related hub
            {selected.facilityId ? ' / facility' : ''} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
