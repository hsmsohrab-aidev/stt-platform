'use server';

import { redirect } from 'next/navigation';
import type { OrgType } from '@stt/types';
import { requireUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type OnboardingState = {
  error: string | null;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function createOrganizationAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const name = String(formData.get('name') ?? '').trim();
  const orgType = String(formData.get('org_type') ?? '').trim() as OrgType;
  const country = String(formData.get('country') ?? 'BD').trim() || 'BD';
  const email = String(formData.get('email') ?? '').trim() || null;

  const allowed: OrgType[] = ['brand', 'supplier', 'auditor'];
  if (!name || name.length < 2) {
    return { error: 'Organization name is required.' };
  }
  if (!allowed.includes(orgType)) {
    return { error: 'Choose brand, supplier, or auditor.' };
  }

  const user = await requireUser();
  const supabase = createClient();

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile?.organization_id) {
    redirect('/');
  }

  // Service role for bootstrap — RLS blocks RETURNING/wallet insert before
  // current_org_id() is set (chicken-and-egg on first org create).
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is required to create an organization.',
    };
  }

  const baseSlug = slugify(name) || `org-${Date.now()}`;
  let slug = baseSlug;
  for (let i = 0; i < 5; i += 1) {
    const { data: clash } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${i + 2}`;
  }

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name,
      slug,
      org_type: orgType,
      country,
      email,
      onboarding_completed: true,
      onboarding_step: 5,
      is_active: true,
    })
    .select('id')
    .single();

  if (orgError || !org) {
    return { error: orgError?.message ?? 'Could not create organization.' };
  }

  const roleName =
    orgType === 'brand'
      ? 'brand_admin'
      : orgType === 'supplier'
        ? 'supplier_admin'
        : 'auditor_lead';

  const { data: role } = await admin
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .maybeSingle();

  const { error: profileError } = await admin
    .from('profiles')
    .update({ organization_id: org.id })
    .eq('id', user.id);

  if (profileError) {
    await admin.from('organizations').delete().eq('id', org.id);
    return { error: profileError.message };
  }

  const { error: memberError } = await admin.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role_id: role?.id ?? null,
    is_owner: true,
  });

  if (memberError) {
    return { error: memberError.message };
  }

  if (orgType === 'supplier' || orgType === 'brand') {
    await admin.from('material_wallets').insert({
      organization_id: org.id,
    });
  }

  redirect('/');
}

export async function completeOnboardingStepAction(step: number) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.organization_id) redirect('/onboarding');

  const completed = step >= 5;
  await supabase
    .from('organizations')
    .update({
      onboarding_step: Math.min(step, 5),
      onboarding_completed: completed,
    })
    .eq('id', profile.organization_id);

  if (completed) redirect('/');
  redirect(`/onboarding?step=${step}`);
}
