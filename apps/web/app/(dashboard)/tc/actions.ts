'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';

export type TcActionState = {
  error: string | null;
  success?: string;
  tcId?: string;
};

export async function issueTcAction(
  _prev: TcActionState,
  formData: FormData
): Promise<TcActionState> {
  const receiverOrgId = String(formData.get('receiver_org_id') ?? '').trim();
  const materialId = String(formData.get('material_id') ?? '');
  const quantity = Number(formData.get('quantity'));
  const certification = String(formData.get('certification') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const orderId = String(formData.get('order_id') ?? '').trim() || null;
  const shipmentId = String(formData.get('shipment_id') ?? '').trim() || null;

  if (!receiverOrgId) return { error: 'Receiver organization ID is required.' };
  if (!materialId) return { error: 'Select a material.' };
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: 'Quantity must be greater than 0.' };
  }

  const {
    supabase,
    userId,
    organizationId: orgId,
    orgName,
  } = await requireActionContext();

  if (shipmentId) {
    const { data: shipment } = await supabase
      .from('shipments')
      .select('id, organization_id, shipper_org_id, consignee_org_id')
      .eq('id', shipmentId)
      .maybeSingle();

    if (!shipment) return { error: 'Shipment not found.' };
    const canLink =
      shipment.organization_id === orgId ||
      shipment.shipper_org_id === orgId ||
      shipment.consignee_org_id === orgId;
    if (!canLink) return { error: 'Shipment is not visible to your organization.' };
  }

  const { data: wallet } = await supabase
    .from('material_wallets')
    .select('id')
    .eq('organization_id', orgId)
    .is('facility_id', null)
    .maybeSingle();

  if (!wallet) return { error: 'No wallet found. Credit material first.' };

  const { data: balance } = await supabase
    .from('wallet_balances')
    .select('available_qty')
    .eq('wallet_id', wallet.id)
    .eq('material_id', materialId)
    .maybeSingle();

  if (!balance || Number(balance.available_qty) < quantity) {
    return { error: 'Insufficient available balance for this TC.' };
  }

  const { data: tc, error: tcError } = await supabase
    .from('transaction_certificates')
    .insert({
      organization_id: orgId,
      issuer_org_id: orgId,
      receiver_org_id: receiverOrgId,
      tc_status: 'issued',
      total_quantity: quantity,
      quantity_unit: 'KG',
      notes,
      created_by: userId,
      ...(orderId ? { order_id: orderId } : {}),
      ...(shipmentId ? { shipment_id: shipmentId } : {}),
    })
    .select('id, tc_number, issue_date')
    .single();

  if (tcError || !tc) {
    return { error: tcError?.message ?? 'TC create failed.' };
  }

  const { error: lineError } = await supabase.from('tc_line_items').insert({
    tc_id: tc.id,
    material_id: materialId,
    quantity,
    unit: 'KG',
    certification,
  });

  if (lineError) return { error: lineError.message };

  const { error: debitError } = await supabase.from('material_transactions').insert({
    wallet_id: wallet.id,
    material_id: materialId,
    transaction_type: 'debit',
    quantity,
    unit: 'KG',
    reference_type: 'tc',
    reference_id: tc.id,
    description: `TC issue ${tc.tc_number}`,
    created_by: userId,
  });

  if (debitError) return { error: debitError.message };

  const { syncMassBalanceForMaterial } = await import('@/lib/wallet/mass-balance');
  await syncMassBalanceForMaterial({
    supabase,
    organizationId: orgId,
    walletId: wallet.id,
    materialId,
  }).catch(() => undefined);

  const { anchorTcDocument } = await import('@/lib/tc/anchor');
  await anchorTcDocument({
    supabase,
    tcId: tc.id,
    tcNumber: tc.tc_number,
    issuerOrgId: orgId,
    receiverOrgId,
    issueDate: tc.issue_date,
    totalQuantity: quantity,
    quantityUnit: 'KG',
    lines: [
      {
        material_id: materialId,
        quantity,
        unit: 'KG',
        certification,
      },
    ],
  }).catch(() => undefined);

  const { notifyTcIssuedWithEmail } = await import('@/lib/email/notify');
  await notifyTcIssuedWithEmail({
    tcId: tc.id,
    tcNumber: tc.tc_number,
    receiverOrgId,
    issuerOrgName: orgName,
    quantity,
    unit: 'KG',
  }).catch(() => {
    // Notification failure must not block TC issuance
  });

  revalidatePath('/tc');
  revalidatePath(`/tc/${tc.id}`);
  revalidatePath('/wallet');
  revalidatePath('/alerts');
  if (shipmentId) {
    revalidatePath('/shipments');
    revalidatePath(`/shipments/${shipmentId}`);
  }
  return {
    error: null,
    success: `Issued ${tc.tc_number}`,
    tcId: tc.id,
  };
}

export async function linkTcShipmentAction(
  _prev: TcActionState,
  formData: FormData
): Promise<TcActionState> {
  const tcId = String(formData.get('tc_id') ?? '').trim();
  const shipmentId = String(formData.get('shipment_id') ?? '').trim() || null;

  if (!tcId) return { error: 'TC required.' };

  const { supabase, organizationId: orgId } = await requireActionContext();

  const { data: tc } = await supabase
    .from('transaction_certificates')
    .select('id, issuer_org_id, shipment_id')
    .eq('id', tcId)
    .maybeSingle();

  if (!tc) return { error: 'TC not found.' };
  if (tc.issuer_org_id !== orgId) {
    return { error: 'Only the issuer can link a shipment.' };
  }

  if (shipmentId) {
    const { data: shipment } = await supabase
      .from('shipments')
      .select('id, organization_id, shipper_org_id, consignee_org_id')
      .eq('id', shipmentId)
      .maybeSingle();

    if (!shipment) return { error: 'Shipment not found.' };
    const canLink =
      shipment.organization_id === orgId ||
      shipment.shipper_org_id === orgId ||
      shipment.consignee_org_id === orgId;
    if (!canLink) return { error: 'Shipment is not visible to your organization.' };
  }

  const { error } = await supabase
    .from('transaction_certificates')
    .update({ shipment_id: shipmentId })
    .eq('id', tcId)
    .eq('issuer_org_id', orgId);

  if (error) return { error: error.message };

  revalidatePath(`/tc/${tcId}`);
  revalidatePath('/tc');
  revalidatePath('/shipments');
  if (shipmentId) revalidatePath(`/shipments/${shipmentId}`);
  if (tc.shipment_id) revalidatePath(`/shipments/${tc.shipment_id}`);

  return {
    error: null,
    success: shipmentId ? 'Shipment linked.' : 'Shipment unlinked.',
    tcId,
  };
}
