import Link from 'next/link';
import { CreateOrderForm } from '@/app/(dashboard)/orders/create-form';
import {
  DonutChart,
  FilterBar,
  JourneyStrip,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
import {
  OrderTrackingMap,
  pinForShipment,
} from '@/components/dashboard/order-tracking-map';
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
import { canActAsBrand } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

const shipBadge: Record<string, string> = {
  pending: 'rounded-full bg-[#EDF1F6] text-stt-muted',
  in_transit: 'rounded-full bg-stt-blue-soft text-stt-blue',
  customs: 'rounded-full bg-stt-amber-soft text-stt-amber',
  delivered: 'rounded-full bg-stt-green-soft text-stt-green-dark',
  exception: 'rounded-full bg-stt-red-soft text-stt-red',
};

export default async function OrdersPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();
  const brandLike = canActAsBrand(ctx.orgType);
  const orgId = ctx.organizationId;

  const [{ data: orders }, { data: shipments }] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, order_number, po_number, season, status, total_quantity, quantity_unit, order_date, buyer_org_id, supplier_org_id'
      )
      .or(
        `organization_id.eq.${orgId},buyer_org_id.eq.${orgId},supplier_org_id.eq.${orgId}`
      )
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('shipments')
      .select(
        'id, shipment_number, status, origin_port, destination_port, eta, order_id, created_at'
      )
      .or(
        `organization_id.eq.${orgId},shipper_org_id.eq.${orgId},consignee_org_id.eq.${orgId}`
      )
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const rows = orders ?? [];
  const shipRows = shipments ?? [];
  const partyIds = Array.from(
    new Set(
      rows.flatMap((o) =>
        [o.buyer_org_id, o.supplier_org_id].filter(Boolean) as string[]
      )
    )
  );

  const { data: orgs } =
    partyIds.length > 0
      ? await supabase.from('organizations').select('id, name').in('id', partyIds)
      : { data: [] };
  const nameById = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  let suppliers: { id: string; name: string }[] = [];
  if (brandLike) {
    const { data: rels } = await supabase
      .from('supplier_relationships')
      .select('supplier_org_id')
      .eq('brand_org_id', orgId)
      .eq('status', 'active');
    const ids = (rels ?? []).map((r) => r.supplier_org_id);
    if (ids.length > 0) {
      const { data: supplierOrgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', ids)
        .order('name');
      suppliers = (supplierOrgs ?? []).map((o) => ({ id: o.id, name: o.name }));
    }
  }

  const inTransit = shipRows.filter((s) =>
    ['in_transit', 'customs'].includes(s.status)
  ).length;
  const exceptions = shipRows.filter((s) => s.status === 'exception').length;
  const deliveredOrders = rows.filter((o) => o.status === 'delivered').length;
  const onTimePct =
    rows.length === 0
      ? 0
      : Math.round(
          ((deliveredOrders +
            rows.filter((o) => ['shipped', 'confirmed', 'in_production'].includes(o.status))
              .length *
              0.5) /
            rows.length) *
            100
        );

  const statusData = countBy(rows, (o) => o.status ?? '—');
  const shipStatusData = countBy(shipRows, (s) => s.status ?? '—');
  const pins = shipRows
    .filter((s) => s.status !== 'delivered')
    .slice(0, 8)
    .map(pinForShipment);
  const exceptionList = shipRows.filter((s) =>
    ['exception', 'customs'].includes(s.status)
  );

  const shipmentByOrder = new Map<string, (typeof shipRows)[0]>();
  for (const s of shipRows) {
    if (s.order_id && !shipmentByOrder.has(s.order_id)) {
      shipmentByOrder.set(s.order_id, s);
    }
  }

  return (
    <PageWrapper
      title="Order Intelligence"
      description="Real-time order visibility · tracking · exceptions"
    >
      <FilterBar
        items={[
          { label: 'Org', value: ctx.orgName.slice(0, 28) },
          { label: 'Window', value: 'Last 90 days' },
          { label: 'Scope', value: brandLike ? 'Buyer' : 'Network' },
        ]}
      />

      <StatBoxes
        items={[
          { label: 'Total orders', value: rows.length },
          { label: 'In transit', value: inTransit, hint: 'Shipments' },
          { label: 'On-time signal', value: `${Math.min(100, onTimePct)}%` },
          { label: 'Exceptions', value: exceptions + exceptionList.filter((s) => s.status === 'customs').length },
        ]}
      />

      <JourneyStrip
        steps={[
          { label: 'Created', done: rows.length > 0 },
          {
            label: 'In production',
            done: rows.some((o) =>
              ['in_production', 'shipped', 'delivered'].includes(o.status)
            ),
            current: rows.some((o) => o.status === 'in_production'),
          },
          {
            label: 'In transit',
            done: inTransit > 0 || deliveredOrders > 0,
            current: inTransit > 0,
          },
          { label: 'Delivered', done: deliveredOrders > 0 },
          { label: 'Insights', done: rows.length > 0 },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 xl:grid-cols-[1.35fr_1fr]">
        <OrderTrackingMap pins={pins} />
        <div className="grid gap-3.5">
          <DonutChart title="Order status" data={statusData} />
          <DonutChart title="Shipment status" data={shipStatusData} />
        </div>
      </div>

      {exceptionList.length > 0 ? (
        <div className="mb-3.5 rounded-xl border border-[#F2C7C7] bg-stt-red-soft/40 shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-[#F2C7C7] px-4 py-3">
            <h3 className="text-[13.5px] font-bold text-[#A33]">Exception queue</h3>
            <Badge className="ml-auto rounded-full bg-stt-red-soft text-stt-red">
              {exceptionList.length}
            </Badge>
          </div>
          <ul className="divide-y divide-[#F2C7C7]">
            {exceptionList.slice(0, 8).map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div>
                  <Link
                    href={`/shipments/${s.id}`}
                    className="font-mono-stt text-[11px] font-semibold text-stt-blue hover:underline"
                  >
                    {s.shipment_number}
                  </Link>
                  <div className="text-[11px] text-stt-muted">
                    {[s.origin_port, s.destination_port].filter(Boolean).join(' → ') ||
                      'Route n/a'}
                  </div>
                </div>
                <Badge className={shipBadge[s.status] ?? shipBadge.pending}>
                  {s.status}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[13.5px] font-bold">Recent orders</h3>
            <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
              {rows.length}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Order</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Route / party</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">ETA</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[12px] text-stt-muted">
                    No orders yet.{' '}
                    {brandLike ? (
                      <span>Create a PO on the right.</span>
                    ) : (
                      <Link href="/brand" className="text-stt-blue hover:underline">
                        Open Brand hub
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((o) => {
                  const counterpartyId =
                    orgId === o.buyer_org_id ? o.supplier_org_id : o.buyer_org_id;
                  const ship = shipmentByOrder.get(o.id);
                  return (
                    <TableRow key={o.id} className="hover:bg-[#F7FAFC]">
                      <TableCell>
                        <Link
                          href={`/orders/${o.id}`}
                          className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                        >
                          {o.order_number}
                        </Link>
                        {o.po_number ? (
                          <div className="text-[10px] text-stt-muted">PO {o.po_number}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-[12px]">
                        {ship ? (
                          <span>
                            {[ship.origin_port, ship.destination_port]
                              .filter(Boolean)
                              .join(' → ') || '—'}
                          </span>
                        ) : (
                          (counterpartyId
                            ? nameById.get(counterpartyId) ?? '—'
                            : '—')
                        )}
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {ship?.eta ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/orders/${o.id}`}
                          className="text-[11px] font-semibold text-stt-blue hover:underline"
                        >
                          Open →
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {brandLike ? (
          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">＋ New purchase order</h3>
            </div>
            <div className="p-4">
              <CreateOrderForm suppliers={suppliers} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-stt-line bg-white p-4 text-[12px] text-stt-muted shadow-[var(--stt-shadow)]">
            Brands create POs. Linked supplier orders appear in this list automatically.
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
