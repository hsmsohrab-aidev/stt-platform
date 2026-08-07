'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type WalletActionState = {
  error: string | null;
  success?: string;
};

async function requireOrg() {
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

  return { supabase, user, orgId: profile.organization_id as string };
}

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

  const { supabase, user, orgId } = await requireOrg();

  let { data: wallet } = await supabase
    .from('material_wallets')
    .select('id')
    .eq('organization_id', orgId)
    .is('facility_id', null)
    .maybeSingle();

  if (!wallet) {
    const { data: created, error } = await supabase
      .from('material_wallets')
      .insert({ organization_id: orgId })
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
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath('/wallet');
  return { error: null, success: `Credited ${quantity} KG` };
}
