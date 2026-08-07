'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';

export type ShipmentActionState = {
  error: string | null;
  success?: string;
  shipmentId?: string;
};

function shipmentNumber() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `SHP-${y}${m}-${r}`;
}

export async function createShipmentAction(
  _prev: ShipmentActionState,
  formData: FormData
): Promise<ShipmentActionState> {
  const orderId = String(formData.get('order_id') ?? '').trim() || null;
  const consigneeOrgId =
    String(formData.get('consignee_org_id') ?? '').trim() || null;
  const originPort = String(formData.get('origin_port') ?? '').trim() || null;
  const destinationPort =
    String(formData.get('destination_port') ?? '').trim() || null;
  const blNumber = String(formData.get('bl_number') ?? '').trim() || null;
  const containerNumber =
    String(formData.get('container_number') ?? '').trim() || null;
  const weight = Number(formData.get('total_weight_kg'));
  const eta = String(formData.get('eta') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  const { supabase, organizationId, orgType } = await requireActionContext();

  const number = shipmentNumber();

  const { data: shipment, error } = await supabase
    .from('shipments')
    .insert({
      organization_id: organizationId,
      order_id: orderId,
      shipment_number: number,
      bl_number: blNumber,
      container_number: containerNumber,
      shipper_org_id: organizationId,
      consignee_org_id:
        consigneeOrgId ??
        (orgType === 'brand' ? organizationId : consigneeOrgId),
      origin_port: originPort,
      destination_port: destinationPort,
      total_weight_kg: Number.isFinite(weight) && weight > 0 ? weight : null,
      eta: eta ? new Date(eta).toISOString() : null,
      status: 'pending',
      current_location: originPort ?? 'Origin',
    })
    .select('id, shipment_number')
    .single();

  if (error || !shipment) {
    return { error: error?.message ?? 'Could not create shipment.' };
  }

  await supabase.from('shipment_events').insert({
    shipment_id: shipment.id,
    event_type: 'created',
    location: originPort,
    description: notes ?? `Shipment ${shipment.shipment_number} created`,
    source: 'manual',
  });

  revalidatePath('/shipments');
  return {
    error: null,
    success: `Created ${shipment.shipment_number}`,
    shipmentId: shipment.id,
  };
}

export async function addShipmentEventAction(
  _prev: ShipmentActionState,
  formData: FormData
): Promise<ShipmentActionState> {
  const shipmentId = String(formData.get('shipment_id') ?? '');
  const eventType = String(formData.get('event_type') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;

  if (!shipmentId) return { error: 'Missing shipment.' };
  if (!eventType) return { error: 'Select an event type.' };

  const { supabase } = await requireActionContext();

  const statusMap: Record<string, string> = {
    departed: 'in_transit',
    arrived_port: 'in_transit',
    customs_cleared: 'customs',
    delivered: 'delivered',
    exception: 'exception',
  };

  const { error } = await supabase.from('shipment_events').insert({
    shipment_id: shipmentId,
    event_type: eventType,
    location,
    description,
    source: 'manual',
  });

  if (error) return { error: error.message };

  const nextStatus = statusMap[eventType];
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    current_location: location,
  };
  if (nextStatus) patch.status = nextStatus;
  if (eventType === 'departed') {
    patch.actual_departure = new Date().toISOString();
  }
  if (eventType === 'delivered') {
    patch.actual_arrival = new Date().toISOString();
  }

  await supabase.from('shipments').update(patch).eq('id', shipmentId);

  revalidatePath('/shipments');
  revalidatePath(`/shipments/${shipmentId}`);
  return { error: null, success: `Logged ${eventType}` };
}
