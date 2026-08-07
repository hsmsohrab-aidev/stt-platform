'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export type EvidenceActionState = {
  error: string | null;
  success?: string | null;
};

export async function addComplianceEvidenceAction(
  _prev: EvidenceActionState,
  formData: FormData
): Promise<EvidenceActionState> {
  const ctx = await requireSessionContext();
  const title = String(formData.get('title') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim() || null;
  const relatedModule =
    String(formData.get('related_module') ?? '').trim() || 'compliance';
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!title) return { error: 'Title is required.' };

  const supabase = createClient();
  const { error } = await supabase.from('compliance_evidence').insert({
    organization_id: ctx.organizationId,
    title,
    evidence_type: url ? 'link' : 'note',
    url,
    related_module: relatedModule,
    notes,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  revalidatePath('/compliance');
  return { error: null, success: 'Evidence attached.' };
}
