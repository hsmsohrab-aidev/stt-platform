'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { seedDemoDataset } from '@/lib/demo/seed';
import { wipeDemoBatches } from '@/lib/demo/wipe';

export type DemoActionState = {
  error: string | null;
  success?: string;
  details?: string[];
};

function revalidateDemoPaths() {
  const paths = [
    '/',
    '/demo-data',
    '/brand',
    '/supplier',
    '/auditor',
    '/orders',
    '/shipments',
    '/materials',
    '/wallet',
    '/tc',
    '/dpp',
    '/verification',
    '/facilities',
    '/supply-chain',
    '/risk',
    '/compliance',
    '/sustainability',
    '/reports',
    '/alerts',
    '/membership',
  ];
  for (const p of paths) revalidatePath(p);
}

export async function loadDemoDataAction(
  _prev: DemoActionState
): Promise<DemoActionState> {
  try {
    const ctx = await requireActionContext();
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('demo_batches')
      .select('id, label')
      .eq('host_organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return {
        error:
          'Demo data already loaded for your organization. Wipe it first, then load again.',
      };
    }

    const result = await seedDemoDataset({
      admin,
      hostOrgId: ctx.organizationId,
      hostOrgType: ctx.orgType,
      hostOrgName: ctx.orgName,
      userId: ctx.userId,
    });

    revalidateDemoPaths();
    return {
      error: null,
      success: `Loaded “${result.label}”.`,
      details: result.meta.summary,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Demo seed failed.',
    };
  }
}

export async function wipeDemoDataAction(
  _prev: DemoActionState
): Promise<DemoActionState> {
  try {
    const ctx = await requireActionContext();
    const admin = createAdminClient();

    const result = await wipeDemoBatches({
      admin,
      hostOrgId: ctx.organizationId,
    });

    if (result.wipedBatches === 0) {
      return { error: null, success: 'Nothing to wipe — no demo batches found.' };
    }

    // Host org mass-balance leftovers from demo credits
    await admin
      .from('mass_balance_records')
      .delete()
      .eq('organization_id', ctx.organizationId);

    revalidateDemoPaths();
    return {
      error: null,
      success: `Removed ${result.wipedBatches} demo batch(es).`,
      details: [result.label],
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Demo wipe failed.',
    };
  }
}
