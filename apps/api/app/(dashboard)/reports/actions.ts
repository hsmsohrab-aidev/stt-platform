'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function logGeneratedReportAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const reportType = String(formData.get('report_type') ?? 'ops').trim();
  const title = String(formData.get('title') ?? 'Report').trim();
  const format = String(formData.get('format') ?? 'csv').trim();
  const supabase = createClient();
  await supabase.from('generated_reports').insert({
    organization_id: ctx.organizationId,
    report_type: reportType,
    title,
    format,
    requested_by: ctx.userId,
  });
  revalidatePath('/reports');
}
