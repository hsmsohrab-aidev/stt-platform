import type { ChainNode } from '@/lib/dashboard/supply-chain';
import {
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
import { ArrowRight } from 'lucide-react';

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

export function SupplyChainMap({ nodes }: { nodes: ChainNode[] }) {
  if (nodes.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[13px] text-stt-muted">
        No chain nodes yet. Link suppliers (brand) or declare facilities (supplier).
      </p>
    );
  }

  return (
    <div className="overflow-x-auto px-4 py-5">
      <div className="flex min-w-max items-stretch gap-0">
        {nodes.map((node, index) => {
          const Icon = TIER_ICON[node.tier] ?? GitBranch;
          return (
            <div key={`${node.orgId}-${node.title}-${index}`} className="flex items-center">
              <div
                className={`w-[152px] rounded-xl border px-3 py-3 ${
                  node.isBrand
                    ? 'border-stt-green bg-stt-green-soft'
                    : 'border-stt-line bg-white'
                }`}
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
              </div>
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
  );
}
