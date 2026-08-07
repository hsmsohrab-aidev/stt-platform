'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';

export type OrderActionState = {
  error: string | null;
  success?: string;
};

function orderNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${y}${m}-${r}`;
}

export async function createOrderAction(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const supplierOrgId = String(formData.get('supplier_org_id') ?? '').trim();
  const poNumber = String(formData.get('po_number') ?? '').trim() || null;
  const season = String(formData.get('season') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim();
  const quantity = Number(formData.get('quantity'));
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!supplierOrgId) return { error: 'Select a supplier.' };
  if (!description) return { error: 'Line description is required.' };
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: 'Quantity must be greater than 0.' };
  }

  const { supabase, organizationId, orgType } = await requireActionContext();

  if (orgType !== 'brand') {
    return { error: 'Only brand organizations can create purchase orders.' };
  }

  const number = orderNumber();

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      organization_id: organizationId,
      buyer_org_id: organizationId,
      supplier_org_id: supplierOrgId,
      order_number: number,
      po_number: poNumber,
      season,
      total_quantity: quantity,
      quantity_unit: 'pcs',
      status: 'confirmed',
      notes,
      order_date: new Date().toISOString().slice(0, 10),
    })
    .select('id, order_number')
    .single();

  if (error || !order) {
    return { error: error?.message ?? 'Could not create order.' };
  }

  const { error: itemError } = await supabase.from('order_items').insert({
    order_id: order.id,
    description,
    quantity,
  });

  if (itemError) return { error: itemError.message };

  revalidatePath('/orders');
  revalidatePath('/');
  return { error: null, success: `Created ${order.order_number}` };
}
