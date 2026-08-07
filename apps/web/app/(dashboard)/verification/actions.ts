'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';

export type VerificationActionState = {
  error: string | null;
  success?: string;
};

export async function createVerificationRequestAction(
  _prev: VerificationActionState,
  formData: FormData
): Promise<VerificationActionState> {
  const supplierOrgId = String(formData.get('supplier_org_id') ?? '').trim();
  const verificationType =
    String(formData.get('verification_type') ?? 'physical').trim() || 'physical';
  const scope = String(formData.get('scope') ?? '').trim() || null;
  const standardsRaw = String(formData.get('standards') ?? '').trim();
  const deadline = String(formData.get('deadline_date') ?? '').trim() || null;
  const budget = Number(formData.get('budget_max_usd'));
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!supplierOrgId) return { error: 'Select a supplier to verify.' };

  const { supabase, organizationId, orgType, userId } =
    await requireActionContext();

  if (orgType !== 'brand') {
    return { error: 'Only brand organizations can request verification.' };
  }

  const standards = standardsRaw
    ? standardsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  const { data, error } = await supabase
    .from('verification_requests')
    .insert({
      buyer_org_id: organizationId,
      supplier_org_id: supplierOrgId,
      verification_type: verificationType,
      scope,
      standards,
      deadline_date: deadline || null,
      budget_max_usd: Number.isFinite(budget) && budget > 0 ? budget : null,
      notes,
      status: 'open',
      created_by: userId,
    })
    .select('id, request_number')
    .single();

  if (error || !data) {
    return { error: error?.message ?? 'Could not create request.' };
  }

  await supabase.from('notifications').insert({
    organization_id: supplierOrgId,
    title: `Verification requested · ${data.request_number}`,
    body: `A brand requested ${verificationType} verification on your org.`,
    severity: 'info',
    module: 'verification',
    entity_type: 'verification_request',
    entity_id: data.id,
    action_url: '/verification',
    channel: 'in_app',
  });

  const { notifyVerificationRequestedEmail } = await import('@/lib/email/notify');
  await notifyVerificationRequestedEmail({
    requestId: data.id,
    requestNumber: data.request_number,
    supplierOrgId,
    verificationType,
  }).catch(() => undefined);

  revalidatePath('/verification');
  revalidatePath('/auditor');
  revalidatePath('/alerts');
  return { error: null, success: `Created ${data.request_number}` };
}

export async function claimVerificationAction(
  requestId: string
): Promise<VerificationActionState> {
  const { supabase, organizationId, orgType, userId } =
    await requireActionContext();

  if (orgType !== 'auditor') {
    return { error: 'Only auditor organizations can claim requests.' };
  }

  const { data: req } = await supabase
    .from('verification_requests')
    .select('id, status, request_number')
    .eq('id', requestId)
    .maybeSingle();

  if (!req) return { error: 'Request not found.' };
  if (req.status !== 'open') return { error: 'Request is no longer open.' };

  const { data: assignment, error } = await supabase
    .from('verification_assignments')
    .insert({
      request_id: requestId,
      auditor_org_id: organizationId,
      auditor_user_id: userId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !assignment) {
    return { error: error?.message ?? 'Claim failed.' };
  }

  await supabase
    .from('verification_requests')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  revalidatePath('/verification');
  revalidatePath('/auditor');
  return { error: null, success: `Claimed ${req.request_number}` };
}

export async function completeVerificationAction(
  _prev: VerificationActionState,
  formData: FormData
): Promise<VerificationActionState> {
  const assignmentId = String(formData.get('assignment_id') ?? '');
  const requestId = String(formData.get('request_id') ?? '');
  const title = String(formData.get('report_title') ?? '').trim();
  const rating = String(formData.get('overall_rating') ?? 'pass').trim();
  const score = Number(formData.get('score'));
  const summary = String(formData.get('findings_summary') ?? '').trim() || null;

  if (!assignmentId || !requestId) return { error: 'Missing assignment.' };
  if (!title) return { error: 'Report title is required.' };

  const { supabase, organizationId, orgType } = await requireActionContext();
  if (orgType !== 'auditor') return { error: 'Auditors only.' };

  const { error: reportError } = await supabase.from('audit_reports').insert({
    assignment_id: assignmentId,
    request_id: requestId,
    report_title: title,
    overall_rating: rating,
    score: Number.isFinite(score) ? score : null,
    findings_summary: summary,
    is_published: true,
    published_at: new Date().toISOString(),
  });

  if (reportError) return { error: reportError.message };

  await supabase
    .from('verification_assignments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .eq('auditor_org_id', organizationId);

  await supabase
    .from('verification_requests')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  const { data: req } = await supabase
    .from('verification_requests')
    .select('buyer_org_id, request_number')
    .eq('id', requestId)
    .maybeSingle();

  if (req?.buyer_org_id) {
    await supabase.from('notifications').insert({
      organization_id: req.buyer_org_id,
      title: `Audit complete · ${req.request_number}`,
      body: `Report "${title}" published (${rating}).`,
      severity: 'info',
      module: 'verification',
      entity_type: 'verification_request',
      entity_id: requestId,
      action_url: '/verification',
      channel: 'in_app',
    });

    const { notifyAuditCompleteEmail } = await import('@/lib/email/notify');
    await notifyAuditCompleteEmail({
      requestId,
      requestNumber: req.request_number,
      buyerOrgId: req.buyer_org_id,
      reportTitle: title,
      rating,
    }).catch(() => undefined);
  }

  revalidatePath('/verification');
  revalidatePath('/auditor');
  revalidatePath('/alerts');
  return { error: null, success: 'Report published.' };
}
