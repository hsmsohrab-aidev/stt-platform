import Link from 'next/link';
import {
  DonutChart,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
import { InteractiveOverview } from '@/components/dashboard/interactive-overview';
import { SupplyChainMap } from '@/components/dashboard/supply-chain-map';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { canActAsBrand } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import { loadInteractiveOverview } from '@/lib/dashboard/overview';
import { loadSupplyChainMap } from '@/lib/dashboard/supply-chain';
import { createClient } from '@/lib/supabase/server';

const TIER_KEYS = [
  'tier_1',
  'tier_2',
  'tier_3',
  'tier_4',
  'tier_5',
  'tier_6',
] as const;

function TierDepthMeter({
  nodes,
}: {
  nodes: Array<{ tier: string; isBrand?: boolean }>;
}) {
  const counts = TIER_KEYS.map((tier) => ({
    tier,
    count: nodes.filter((n) => n.tier === tier).length,
  }));
  const visibleTiers = counts.filter((c) => c.count > 0).length;
  const depthPct = Math.round((visibleTiers / TIER_KEYS.length) * 100);
  const tier1 = counts[0]?.count ?? 0;
  const deeper = counts.slice(1).reduce((s, c) => s + c.count, 0);

  return (
    <div className="mb-3.5 rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[13.5px] font-bold text-stt-ink">
            Tier visibility depth
          </h3>
          <p className="mt-0.5 text-[11.5px] text-stt-muted">
            Visible Tier-1 vs deeper tiers (2–6) across mapped nodes
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-[22px] font-bold text-stt-navy">
            {depthPct}%
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-stt-faint">
            {visibleTiers}/6 tiers mapped
          </div>
        </div>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EDF1F6]">
        <div
          className="h-full rounded-full bg-stt-green"
          style={{ width: `${depthPct}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {counts.map((c) => (
          <div
            key={c.tier}
            className="rounded-lg border border-stt-line bg-[#F8FAFC] px-2 py-2 text-center"
          >
            <div className="font-mono-stt text-[10px] text-stt-faint">
              T{c.tier.replace('tier_', '')}
            </div>
            <div className="font-display text-[16px] font-bold text-stt-ink">
              {c.count}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-stt-muted">
        <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
          Tier-1 visible · {tier1}
        </Badge>
        <Badge className="rounded-full bg-stt-amber-soft text-stt-amber">
          Deeper (T2–6) · {deeper}
        </Badge>
        {deeper === 0 && tier1 > 0 ? (
          <span className="text-stt-amber">
            Link Tier-2+ suppliers to deepen visibility.
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default async function SupplyChainPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();
  const brandLike = canActAsBrand(ctx.orgType);

  const [nodes, facilitiesResult, overview] = await Promise.all([
    loadSupplyChainMap(ctx),
    supabase
      .from('facilities')
      .select('id, name, facility_type, tier_level, city, country, is_verified')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false }),
    loadInteractiveOverview(ctx),
  ]);

  const ownFacilities = facilitiesResult.data ?? [];
  const tierData = countBy(nodes, (n) => n.tier);
  const typeData = countBy(ownFacilities, (f) => f.facility_type ?? '—');

  return (
    <PageWrapper
      title="Supply Chain"
      description={
        brandLike
          ? 'Interactive map · tier depth · facilities'
          : 'Facility chain · declare units to extend the map'
      }
      actions={
        <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
          <Link href="/facilities">Manage facilities</Link>
        </Button>
      }
    >
      <div className="mb-3.5">
        <InteractiveOverview {...overview} />
      </div>

      <StatBoxes
        items={[
          { label: 'Chain nodes', value: nodes.length },
          { label: 'Your facilities', value: ownFacilities.length },
          {
            label: 'Verified',
            value: ownFacilities.filter((f) => f.is_verified).length,
          },
          {
            label: 'With TC signal',
            value: nodes.filter((n) => n.latestTc).length,
          },
        ]}
      />

      <TierDepthMeter nodes={nodes} />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <DonutChart title="Nodes by tier" data={tierData} />
        <DonutChart title="Your facility types" data={typeData} />
      </div>

      <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[12.5px] font-bold">Tier flow</h3>
          <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
            {nodes.length} nodes
          </Badge>
        </div>
        <SupplyChainMap nodes={nodes} />
        {brandLike && nodes.filter((n) => !n.isBrand).length === 0 ? (
          <p className="border-t border-stt-line px-4 py-3 text-[11.5px] text-stt-muted">
            Link suppliers from{' '}
            <Link href="/brand" className="font-semibold text-stt-blue underline">
              Brand hub
            </Link>{' '}
            to populate tiers.
          </p>
        ) : null}
      </div>

      <div className="mt-3.5 rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[12.5px] font-bold">Your facilities</h3>
          <Badge className="ml-auto rounded-full bg-[#EDF1F6] text-stt-muted">
            {ownFacilities.length}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase text-stt-faint">Name</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Type</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Tier</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownFacilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-[12px] text-stt-muted">
                  No facilities yet —{' '}
                  <Link href="/facilities" className="text-stt-blue underline">
                    declare one
                  </Link>
                  .
                </TableCell>
              </TableRow>
            ) : (
              ownFacilities.map((f) => (
                <TableRow key={f.id} className="hover:bg-[#F7FAFC]">
                  <TableCell>
                    <Link
                      href={`/facilities/${f.id}`}
                      className="text-[12px] font-semibold text-stt-blue hover:underline"
                    >
                      {f.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[12px]">{f.facility_type}</TableCell>
                  <TableCell className="font-mono-stt text-[11px]">
                    {f.tier_level ?? '—'}
                  </TableCell>
                  <TableCell className="text-[12px] text-stt-muted">
                    {[f.city, f.country].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
}
