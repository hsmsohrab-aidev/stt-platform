'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';

export type WalletActionState = {
  error: string | null;
  success?: string;
};

export async function creditWalletAction(
  _prev: WalletActionState,
  formData: FormData
): Promise<WalletActionState> {
  const materialId = String(formData.get('material_id') ?? '');
  const quantity = Number(formData.get('quantity'));
  const description = String(formData.get('description') ?? '').trim() || null;

  if (!materialId) return { error: 'Select a material.' };
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: 'Quantity must be greater than 0.' };
  }

  const { supabase, userId, organizationId } = await requireActionContext();

  let { data: wallet } = await supabase
    .from('material_wallets')
    .select('id')
    .eq('organization_id', organizationId)
    .is('facility_id', null)
    .maybeSingle();

  if (!wallet) {
    const { data: created, error } = await supabase
      .from('material_wallets')
      .insert({ organization_id: organizationId })
      .select('id')
      .single();
    if (error || !created) return { error: error?.message ?? 'Wallet create failed.' };
    wallet = created;
  }

  const { error } = await supabase.from('material_transactions').insert({
    wallet_id: wallet.id,
    material_id: materialId,
    transaction_type: 'credit',
    quantity,
    unit: 'KG',
    reference_type: 'opening_balance',
    description,
    created_by: userId,
  });

  if (error) return { error: error.message };

  const { syncMassBalanceForMaterial } = await import('@/lib/wallet/mass-balance');
  await syncMassBalanceForMaterial({
    supabase,
    organizationId,
    walletId: wallet.id,
    materialId,
  }).catch(() => undefined);

  revalidatePath('/wallet');
  return { error: null, success: `Credited ${quantity} KG` };
}
