import { redirect } from 'next/navigation';
import type { OrgType } from '@stt/types';
import { createClient } from '@/lib/supabase/server';

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  orgName: string;
  orgType: OrgType;
  orgSlug: string;
  onboardingCompleted: boolean;
  roleName: string | null;
};

export async function requireSessionContext(): Promise<SessionContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.organization_id) redirect('/onboarding');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, org_type, slug, onboarding_completed')
    .eq('id', profile.organization_id)
    .maybeSingle();

  if (!org) redirect('/onboarding');

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role_id, roles(name)')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .maybeSingle();

  const roleRelation = membership?.roles as
    | { name: string }
    | { name: string }[]
    | null
    | undefined;
  const roleName = Array.isArray(roleRelation)
    ? roleRelation[0]?.name ?? null
    : roleRelation?.name ?? null;

  return {
    userId: user.id,
    email: user.email ?? '',
    fullName: profile.full_name,
    organizationId: org.id,
    orgName: org.name,
    orgType: org.org_type as OrgType,
    orgSlug: org.slug,
    onboardingCompleted: Boolean(org.onboarding_completed),
    roleName,
  };
}
