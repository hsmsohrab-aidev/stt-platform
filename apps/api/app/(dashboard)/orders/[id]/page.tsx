import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { createClient } from '@/lib/supabase/server';

type PageProps = { params: { id: string } };

export default async function OrderDetailPage({ params }: PageProps) {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_number, po_number, season, status, total_quantity, quantity_unit, order_date, required_delivery_date, notes, organization_id, buyer_org_id, supplier_org_id, created_at'
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!order) notFound();

  const canView =
    order.organization_id === ctx.organizationId ||
    order.buyer_org_id === ctx.organizationId ||
    order.supplier_org_id === ctx.organizationId;
  if (!canView) notFound();

  const partyIds = [order.buyer_org_id, order.supplier_org_id].filter(
    Boolean
  ) as string[];

  const [{ data: orgs }, { data: shipments }, { data: tcs }, { data: lines }] =
    await Promise.all([
      partyIds.length
        ? supabase.from('organizations').select('id, name, org_type, city, country').in('id', partyIds)
        : Promise.resolve({ data: [] as { id: string; name: string; org_type: string; city: string | null; country: string | null }[] }),
      supabase
        .from('shipments')
        .select(
          'id, shipment_number, status, origin_port, destination_port, eta, total_weight_kg'
        )
        .eq('order_id', order.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transaction_certificates')
        .select('id, tc_number, tc_status, total_quantity, quantity_unit, issue_date')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('order_items')
        .select('id, style_number, description, quantity, color, unit_price')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true }),
    ]);

  const nameById = new Map((orgs ?? []).map((o) => [o.id, o]));

  return (
    <PageWrapper
      title={order.order_number}
      description={`PO ${order.po_number ?? '—'} · ${order.season ?? 'season n/a'}`}
      actions={
        <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
          <Link href="/orders">Back to orders</Link>
        </Button>
      }
    >
      <div className="mb-3.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Status', order.status],
          [
            'Quantity',
            `${Number(order.total_quantity ?? 0).toLocaleString()} ${order.quantity_unit}`,
          ],
          ['Order date', order.order_date ?? '—'],
          ['Delivery', order.required_delivery_date ?? '—'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
          >
            <div className="text-[11px] font-semibold text-stt-muted">{label}</div>
            <div className="mt-1 font-display text-[18px] font-bold capitalize text-stt-ink">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <h3 className="mb-3 text-[13.5px] font-bold">Parties</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['buyer_org_id', 'supplier_org_id'] as const).map((key) => {
                const id = order[key];
                const org = id ? nameById.get(id) : null;
                return (
                  <div
                    key={key}
                    className="rounded-[10px] border border-stt-line bg-[#F8FAFC] p-3"
                  >
                    <div className="text-[10.5px] font-semibold uppercase tracking-wide text-stt-faint">
                      {key === 'buyer_org_id' ? 'Buyer' : 'Supplier'}
                    </div>
                    <div className="mt-1 text-[13px] font-semibold text-stt-ink">
                      {org?.name ?? '—'}
                    </div>
                    {org ? (
                      <div className="mt-0.5 text-[11.5px] text-stt-muted">
                        {org.org_type}
                        {[org.city, org.country].filter(Boolean).length
                          ? ` · ${[org.city, org.country].filter(Boolean).join(', ')}`
                          : ''}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {order.notes ? (
              <div className="mt-3 space-y-1 text-[12.5px] text-stt-muted">
                <p>{order.notes}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Linked shipments</h3>
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
                      No shipments linked yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (shipments ?? []).map((s) => (
                    <TableRow key={s.id} className="hover:bg-[#F7FAFC]">
                      <TableCell>
                        <Link
                          href={`/shipments/${s.id}`}
                          className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                        >
                          {s.shipment_number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        {[s.origin_port, s.destination_port]
                          .filter(Boolean)
                          .join(' → ') || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
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
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Linked TCs</h3>
              <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
                {tcs?.length ?? 0}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase text-stt-faint">TC</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tcs ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                      No certificates attached to this PO.
                    </TableCell>
                  </TableRow>
                ) : (
                  (tcs ?? []).map((tc) => (
                    <TableRow key={tc.id} className="hover:bg-[#F7FAFC]">
                      <TableCell>
                        <Link
                          href={`/tc/${tc.id}`}
                          className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                        >
                          {tc.tc_number}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {Number(tc.total_quantity ?? 0).toLocaleString()}{' '}
                        {tc.quantity_unit}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                          {tc.tc_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[13.5px] font-bold">Line items</h3>
          </div>
          {(lines ?? []).length === 0 ? (
            <p className="px-4 py-6 text-[12px] text-stt-muted">
              No line items on this order yet.
            </p>
          ) : (
            <ul className="divide-y divide-stt-line">
              {(lines ?? []).map((line, idx) => (
                <li key={line.id} className="px-4 py-3">
                  <div className="text-[12.5px] font-semibold text-stt-ink">
                    #{idx + 1} · {line.description ?? line.style_number ?? 'Item'}
                  </div>
                  <div className="font-mono-stt mt-0.5 text-[11px] text-stt-muted">
                    {Number(line.quantity ?? 0).toLocaleString()} pcs
                    {line.color ? ` · ${line.color}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
