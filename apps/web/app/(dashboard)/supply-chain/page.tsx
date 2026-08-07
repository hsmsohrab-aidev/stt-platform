import Link from 'next/link';
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
import { requireSessionContext } from '@/lib/auth/session';
import { loadSupplyChainMap } from '@/lib/dashboard/supply-chain';
import { createClient } from '@/lib/supabase/server';

export default async function SupplyChainPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const [nodes, facilitiesResult] = await Promise.all([
    loadSupplyChainMap(ctx),
    supabase
      .from('facilities')
      .select('id, name, facility_type, tier_level, city, country, is_verified')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false }),
  ]);

  const ownFacilities = facilitiesResult.data;
  return (
    <PageWrapper
      title="Supply Chain"
      description={
        ctx.orgType === 'brand'
          ? 'Tier map · linked suppliers → brand'
          : 'Facility chain · declare units to extend the map'
      }
      actions={
        <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
          <Link href="/facilities">Manage facilities</Link>
        </Button>
      }
    >
      <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[12.5px] font-bold">Chain map</h3>
          <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
            {nodes.length} nodes
          </Badge>
        </div>
        <SupplyChainMap nodes={nodes} />
        {ctx.orgType === 'brand' && nodes.filter((n) => !n.isBrand).length === 0 ? (
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
            {ownFacilities?.length ?? 0}
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
            {(ownFacilities ?? []).length === 0 ? (
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
              (ownFacilities ?? []).map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="text-[12px] font-semibold">{f.name}</TableCell>
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
