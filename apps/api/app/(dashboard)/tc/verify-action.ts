'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';

export type VerifyTcState = {
  error: string | null;
  success?: string;
};

export async function verifyTcAction(tcId: string): Promise<VerifyTcState> {
  const { supabase, userId, organizationId } = await requireActionContext();

  const { data: tc } = await supabase
    .from('transaction_certificates')
    .select('id, tc_number, tc_status, receiver_org_id')
    .eq('id', tcId)
    .maybeSingle();

  if (!tc) return { error: 'TC not found.' };
  if (tc.receiver_org_id !== organizationId) {
    return { error: 'Only the receiver organization can verify this TC.' };
  }
  if (tc.tc_status === 'verified') {
    return { error: null, success: `${tc.tc_number} already verified.` };
  }

  const { error: updateError } = await supabase
    .from('transaction_certificates')
    .update({
      tc_status: 'verified',
      verified_by: userId,
      verified_at: new Date().toISOString(),
    })
    .eq('id', tcId);

  if (updateError) return { error: updateError.message };

  await supabase.from('tc_verifications').insert({
    tc_id: tcId,
    verification_status: 'completed',
    verified_by: userId,
    verifier_org_id: organizationId,
    method: 'platform',
  });

  revalidatePath('/tc');
  revalidatePath('/');
  revalidatePath('/brand');
  return { error: null, success: `Verified ${tc.tc_number}` };
}
