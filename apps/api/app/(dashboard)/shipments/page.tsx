import Link from 'next/link';
import { CreateShipmentForm } from '@/app/(dashboard)/shipments/create-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

const statusBadge: Record<string, string> = {
  pending: 'rounded-full bg-[#EDF1F6] text-stt-muted',
  in_transit: 'rounded-full bg-stt-blue-soft text-stt-blue',
  customs: 'rounded-full bg-stt-amber-soft text-stt-amber',
  delivered: 'rounded-full bg-stt-green-soft text-stt-green-dark',
  exception: 'rounded-full bg-stt-red-soft text-stt-red',
};

export default async function ShipmentsPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();
  const orgId = ctx.organizationId;

  const [{ data: shipments }, { data: orders }, { data: rels }] = await Promise.all([
    supabase
      .from('shipments')
      .select(
        'id, shipment_number, status, origin_port, destination_port, current_location, eta, total_weight_kg, order_id, created_at'
      )
      .or(
        `organization_id.eq.${orgId},shipper_org_id.eq.${orgId},consignee_org_id.eq.${orgId}`
      )
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('orders')
      .select('id, order_number')
      .or(
        `organization_id.eq.${orgId},buyer_org_id.eq.${orgId},supplier_org_id.eq.${orgId}`
      )
      .order('created_at', { ascending: false })
      .limit(40),
    ctx.orgType === 'brand'
      ? supabase
          .from('supplier_relationships')
          .select('supplier_org_id')
          .eq('brand_org_id', orgId)
          .eq('status', 'active')
      : supabase
          .from('supplier_relationships')
          .select('brand_org_id')
          .eq('supplier_org_id', orgId)
          .eq('status', 'active'),
  ]);

  const counterpartyIds =
    ctx.orgType === 'brand'
      ? (rels ?? []).map((r) => (r as { supplier_org_id: string }).supplier_org_id)
      : (rels ?? []).map((r) => (r as { brand_org_id: string }).brand_org_id);

  const { data: counterpartyOrgs } =
    counterpartyIds.length > 0
      ? await supabase
          .from('organizations')
          .select('id, name')
          .in('id', counterpartyIds)
          .order('name')
      : { data: [] };

  return (
    <PageWrapper
      title="Shipments"
      description="Track cargo · ports · status timeline"
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Active / recent</h3>
            <Badge className="ml-auto rounded-full bg-stt-blue-soft text-stt-blue">
              {shipments?.length ?? 0}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Shipment</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Route</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(shipments ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No shipments yet.
                  </TableCell>
                </TableRow>
              ) : (
                (shipments ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`/shipments/${s.id}`}
                        className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                      >
                        {s.shipment_number}
                      </Link>
                      {s.current_location ? (
                        <div className="text-[10px] text-stt-muted">{s.current_location}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-[12px]">
                      {[s.origin_port, s.destination_port].filter(Boolean).join(' → ') ||
                        '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadge[s.status] ?? statusBadge.pending}>
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">＋ New shipment</h3>
          </div>
          <div className="p-4">
            <CreateShipmentForm
              orders={(orders ?? []).map((o) => ({
                id: o.id,
                label: o.order_number,
              }))}
              counterparties={(counterpartyOrgs ?? []).map((o) => ({
                id: o.id,
                label: o.name,
              }))}
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
