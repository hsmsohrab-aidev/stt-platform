'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type TcActionState = {
  error: string | null;
  success?: string;
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

  if (!receiverOrgId) return { error: 'Receiver organization ID is required.' };
  if (!materialId) return { error: 'Select a material.' };
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: 'Quantity must be greater than 0.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.organization_id) redirect('/onboarding');
  const orgId = profile.organization_id;

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
      created_by: user.id,
    })
    .select('id, tc_number')
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
    created_by: user.id,
  });

  if (debitError) return { error: debitError.message };

  revalidatePath('/tc');
  revalidatePath('/wallet');
  return { error: null, success: `Issued ${tc.tc_number}` };
}
