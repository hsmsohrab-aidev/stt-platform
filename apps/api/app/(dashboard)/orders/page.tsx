import Link from 'next/link';
import { CreateOrderForm } from '@/app/(dashboard)/orders/create-form';
import {
  BarChart,
  DonutChart,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
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
import { canActAsBrand } from '@/lib/auth/capabilities';
import { createClient } from '@/lib/supabase/server';

export default async function OrdersPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();
  const brandLike = canActAsBrand(ctx.orgType);

  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, order_number, po_number, season, status, total_quantity, quantity_unit, order_date, buyer_org_id, supplier_org_id'
    )
    .or(
      `organization_id.eq.${ctx.organizationId},buyer_org_id.eq.${ctx.organizationId},supplier_org_id.eq.${ctx.organizationId}`
    )
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = orders ?? [];
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
      .eq('brand_org_id', ctx.organizationId)
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

  const inProduction = rows.filter((o) => o.status === 'in_production').length;
  const shipped = rows.filter((o) => o.status === 'shipped').length;
  const delivered = rows.filter((o) => o.status === 'delivered').length;
  const statusData = countBy(rows, (o) => o.status ?? '—');
  const seasonData = countBy(
    rows.filter((o) => o.season),
    (o) => String(o.season)
  );

  return (
    <PageWrapper
      title="Orders"
      description={
        brandLike
          ? 'Purchase orders to linked suppliers'
          : 'Incoming / assigned purchase orders'
      }
    >
      <StatBoxes
        items={[
          { label: 'Total', value: rows.length },
          { label: 'In production', value: inProduction },
          { label: 'Shipped', value: shipped },
          { label: 'Delivered', value: delivered },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <DonutChart title="Status breakdown" data={statusData} />
        {seasonData.length > 0 ? (
          <BarChart title="By season" data={seasonData} />
        ) : null}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Order list</h3>
            <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
              {rows.length}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Order</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Counterparty</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[12px] text-stt-muted">
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((o) => {
                  const counterpartyId =
                    ctx.organizationId === o.buyer_org_id
                      ? o.supplier_org_id
                      : o.buyer_org_id;
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
                        {counterpartyId
                          ? nameById.get(counterpartyId) ?? '—'
                          : '—'}
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {Number(o.total_quantity ?? 0).toLocaleString()} {o.quantity_unit}
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
              <h3 className="text-[12.5px] font-bold">＋ New purchase order</h3>
            </div>
            <div className="p-4">
              <CreateOrderForm suppliers={suppliers} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-stt-line bg-white p-4 text-[12px] text-stt-muted shadow-[var(--stt-shadow)]">
            Brands create POs. When a brand assigns you as supplier, the order
            appears in this list.
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
