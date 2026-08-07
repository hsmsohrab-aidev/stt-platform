import type { ChainNode } from '@/lib/dashboard/supply-chain';
import { Badge } from '@/components/ui/badge';

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

const TIER_ICON: Record<string, string> = {
  tier_6: '🌱',
  tier_5: '🧵',
  tier_4: '🪡',
  tier_3: '💧',
  tier_2: '🏭',
  tier_1: '👕',
  brand: '🛍️',
  org: '🏢',
};

export function SupplyChainMap({ nodes }: { nodes: ChainNode[] }) {
  if (nodes.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[12px] text-stt-muted">
        No chain nodes yet. Link suppliers (brand) or declare facilities (supplier).
      </p>
    );
  }

  return (
    <div className="overflow-x-auto px-4 py-5">
      <div className="flex min-w-max items-stretch gap-0">
        {nodes.map((node, index) => (
          <div key={`${node.orgId}-${node.title}-${index}`} className="flex items-center">
            <div
              className={`w-[148px] rounded-xl border px-3 py-3 ${
                node.isBrand
                  ? 'border-stt-green bg-stt-green-soft'
                  : 'border-stt-line bg-white'
              }`}
            >
              <div className="grid size-9 place-items-center rounded-lg bg-stt-green-soft text-base">
                {TIER_ICON[node.tier] ?? '📦'}
              </div>
              <div className="mt-2 text-[9.5px] font-semibold uppercase tracking-wide text-stt-faint">
                {TIER_LABEL[node.tier] ?? node.tier}
              </div>
              <div className="mt-0.5 text-[12px] font-bold leading-snug text-stt-ink">
                {node.title}
              </div>
              <div className="mt-1 text-[10px] text-stt-muted">{node.subtitle}</div>
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
                →
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
