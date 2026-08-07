'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export type AlertRuleActionState = {
  error: string | null;
  success?: string | null;
};

export async function createAlertRuleAction(
  _prev: AlertRuleActionState,
  formData: FormData
): Promise<AlertRuleActionState> {
  const ctx = await requireSessionContext();
  const name = String(formData.get('name') ?? '').trim();
  const ruleModule = String(formData.get('module') ?? '').trim() || 'risk';
  const conditionType =
    String(formData.get('condition_type') ?? '').trim() || 'threshold';
  const severity = String(formData.get('severity') ?? '').trim() || 'medium';
  const threshold = Number(formData.get('threshold'));
  const description = String(formData.get('description') ?? '').trim() || null;

  if (!name) return { error: 'Rule name is required.' };

  const supabase = createClient();
  const { error } = await supabase.from('alert_rules').insert({
    organization_id: ctx.organizationId,
    name,
    description,
    module: ruleModule,
    condition_type: conditionType,
    condition_config: {
      field:
        conditionType === 'date_trigger' ? 'cert_expiry_days' : 'wallet_available_kg',
      operator: conditionType === 'date_trigger' ? '<=' : '<',
      value: Number.isFinite(threshold)
        ? threshold
        : conditionType === 'date_trigger'
          ? 30
          : 100,
    },
    severity,
    channels: ['in_app'],
    is_active: true,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  revalidatePath('/alerts');
  return { error: null, success: 'Rule created.' };
}

export async function toggleAlertRuleAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const ruleId = String(formData.get('rule_id') ?? '').trim();
  const next = String(formData.get('next_active') ?? '') === 'true';
  if (!ruleId) return;
  const supabase = createClient();
  await supabase
    .from('alert_rules')
    .update({ is_active: next })
    .eq('id', ruleId)
    .eq('organization_id', ctx.organizationId);
  revalidatePath('/alerts');
}
