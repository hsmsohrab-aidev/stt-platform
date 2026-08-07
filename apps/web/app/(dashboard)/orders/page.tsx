import { CreateOrderForm } from '@/app/(dashboard)/orders/create-form';
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

export default async function OrdersPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, order_number, po_number, season, status, total_quantity, quantity_unit, order_date, buyer_org_id, supplier_org_id'
    )
    .or(
      `organization_id.eq.${ctx.organizationId},buyer_org_id.eq.${ctx.organizationId},supplier_org_id.eq.${ctx.organizationId}`
    )
    .order('created_at', { ascending: false })
    .limit(40);

  const partyIds = Array.from(
    new Set(
      (orders ?? []).flatMap((o) =>
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
  if (ctx.orgType === 'brand') {
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

  return (
    <PageWrapper
      title="Orders"
      description={
        ctx.orgType === 'brand'
          ? 'Purchase orders to linked suppliers'
          : 'Incoming / assigned purchase orders'
      }
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Order list</h3>
            <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
              {orders?.length ?? 0}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Order</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Counterparty</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orders ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-[12px] text-stt-muted">
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                (orders ?? []).map((o) => {
                  const counterpartyId =
                    ctx.organizationId === o.buyer_org_id
                      ? o.supplier_org_id
                      : o.buyer_org_id;
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <div className="font-mono-stt text-[11px] text-stt-blue">
                          {o.order_number}
                        </div>
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
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {ctx.orgType === 'brand' ? (
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
