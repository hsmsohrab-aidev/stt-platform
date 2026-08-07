import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddShipmentEventForm } from '@/app/(dashboard)/shipments/event-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

type PageProps = { params: { id: string } };

const statusBadge: Record<string, string> = {
  pending: 'rounded-full bg-[#EDF1F6] text-stt-muted',
  in_transit: 'rounded-full bg-stt-blue-soft text-stt-blue',
  customs: 'rounded-full bg-stt-amber-soft text-stt-amber',
  delivered: 'rounded-full bg-stt-green-soft text-stt-green-dark',
  exception: 'rounded-full bg-stt-red-soft text-stt-red',
};

export default async function ShipmentDetailPage({ params }: PageProps) {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: shipment } = await supabase
    .from('shipments')
    .select(
      'id, shipment_number, status, bl_number, container_number, origin_port, destination_port, current_location, eta, etd, actual_departure, actual_arrival, total_weight_kg, order_id, organization_id, shipper_org_id, consignee_org_id'
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!shipment) notFound();

  const canView =
    shipment.organization_id === ctx.organizationId ||
    shipment.shipper_org_id === ctx.organizationId ||
    shipment.consignee_org_id === ctx.organizationId;

  if (!canView) notFound();

  const [{ data: events }, { data: linkedTcs }] = await Promise.all([
    supabase
      .from('shipment_events')
      .select('id, event_type, event_time, location, description, source')
      .eq('shipment_id', shipment.id)
      .order('event_time', { ascending: false }),
    supabase
      .from('transaction_certificates')
      .select('id, tc_number, tc_status, total_quantity, quantity_unit')
      .eq('shipment_id', shipment.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  let orderNumber: string | null = null;
  if (shipment.order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', shipment.order_id)
      .maybeSingle();
    orderNumber = order?.order_number ?? null;
  }

  return (
    <PageWrapper
      title={shipment.shipment_number}
      description="Shipment tracking timeline"
      actions={
        <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
          <Link href="/shipments">Back</Link>
        </Button>
      }
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusBadge[shipment.status] ?? statusBadge.pending}>
                {shipment.status}
              </Badge>
              {orderNumber ? (
                <span className="font-mono-stt text-[11px] text-stt-blue">
                  Order {orderNumber}
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[12px]">
              <div>
                <div className="text-[10px] font-semibold uppercase text-stt-faint">Route</div>
                <div className="font-semibold">
                  {[shipment.origin_port, shipment.destination_port]
                    .filter(Boolean)
                    .join(' → ') || '—'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-stt-faint">
                  Current location
                </div>
                <div className="font-semibold">{shipment.current_location ?? '—'}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-stt-faint">B/L</div>
                <div className="font-mono-stt text-[11px]">{shipment.bl_number ?? '—'}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-stt-faint">
                  Container
                </div>
                <div className="font-mono-stt text-[11px]">
                  {shipment.container_number ?? '—'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-stt-faint">Weight</div>
                <div className="font-mono-stt text-[11px]">
                  {shipment.total_weight_kg != null
                    ? `${Number(shipment.total_weight_kg).toLocaleString()} KG`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-stt-faint">ETA</div>
                <div className="font-mono-stt text-[11px]">
                  {shipment.eta
                    ? new Date(shipment.eta).toLocaleDateString()
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <div className="flex items-center gap-2">
              <h3 className="text-[12.5px] font-bold">Linked TCs</h3>
              <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
                {linkedTcs?.length ?? 0}
              </Badge>
            </div>
            {(linkedTcs ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-stt-muted">
                No certificates linked. Attach a shipment when issuing a TC, or
                link from the TC detail page.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-stt-line">
                {(linkedTcs ?? []).map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-[12px]"
                  >
                    <Link
                      href={`/tc/${t.id}`}
                      className="font-mono-stt font-semibold text-stt-blue hover:underline"
                    >
                      {t.tc_number}
                    </Link>
                    <span className="text-stt-muted">
                      {t.tc_status}
                      {t.total_quantity != null
                        ? ` · ${Number(t.total_quantity).toLocaleString()} ${t.quantity_unit}`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <h3 className="text-[12.5px] font-bold">Timeline</h3>
            <div className="relative mt-3 space-y-3 border-l border-stt-line pl-4">
              {(events ?? []).length === 0 ? (
                <p className="text-[12px] text-stt-muted">No events yet.</p>
              ) : (
                (events ?? []).map((e) => (
                  <div key={e.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-stt-green" />
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-[12px] capitalize">
                        {e.event_type.replace(/_/g, ' ')}
                      </b>
                      <span className="font-mono-stt text-[10px] text-stt-faint">
                        {new Date(e.event_time).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-stt-muted">
                      {[e.location, e.description].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">＋ Log event</h3>
          </div>
          <div className="p-4">
            <AddShipmentEventForm shipmentId={shipment.id} />
            <p className="mt-3 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11px] text-[#1E4FA8]">
              Events update shipment status automatically (e.g. Departed → in_transit,
              Delivered → delivered).
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
