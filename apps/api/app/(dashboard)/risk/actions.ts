'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export type RiskMitigationActionState = {
  error: string | null;
  success?: string | null;
};

const ALLOWED = new Set(['open', 'in_progress', 'closed']);

export async function updateRiskMitigationAction(
  _prev: RiskMitigationActionState,
  formData: FormData
): Promise<RiskMitigationActionState> {
  const ctx = await requireSessionContext();
  const flagKey = String(formData.get('flag_key') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim() || null;
  const ownerName = String(formData.get('owner_name') ?? '').trim() || null;
  const dueRaw = String(formData.get('due_date') ?? '').trim();
  const dueDate = dueRaw || null;

  if (!flagKey) return { error: 'Missing flag.' };
  if (!ALLOWED.has(status)) return { error: 'Invalid status.' };

  const supabase = createClient();
  const { error } = await supabase.from('risk_flag_states').upsert(
    {
      organization_id: ctx.organizationId,
      flag_key: flagKey,
      status,
      note,
      owner_name: ownerName,
      due_date: dueDate,
      updated_by: ctx.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,flag_key' }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/risk');
  return { error: null, success: 'Updated' };
}
