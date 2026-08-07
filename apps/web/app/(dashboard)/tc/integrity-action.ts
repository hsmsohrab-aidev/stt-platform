'use server';

import { requireActionContext } from '@/lib/auth/session';
import { verifyTcIntegrity } from '@/lib/tc/anchor';

export type IntegrityCheckState = {
  error: string | null;
  match?: boolean;
  storedHash?: string | null;
  computedHash?: string;
};

export async function checkTcIntegrityAction(
  tcId: string
): Promise<IntegrityCheckState> {
  const { supabase, organizationId } = await requireActionContext();

  const { data: tc } = await supabase
    .from('transaction_certificates')
    .select('issuer_org_id, receiver_org_id')
    .eq('id', tcId)
    .maybeSingle();

  if (!tc) return { error: 'TC not found.' };
  if (
    tc.issuer_org_id !== organizationId &&
    tc.receiver_org_id !== organizationId
  ) {
    return { error: 'Not authorized.' };
  }

  const result = await verifyTcIntegrity({ supabase, tcId });
  if (!result.ok) return { error: result.error };

  return {
    error: null,
    match: result.match,
    storedHash: result.storedHash,
    computedHash: result.computedHash,
  };
}
