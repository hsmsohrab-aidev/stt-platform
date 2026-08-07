import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { OrgType } from '@stt/types';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

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

export type ActionContext = SessionContext & {
  supabase: SupabaseClient;
  user: User;
};

type SessionLoadResult =
  | { status: 'unauthenticated' }
  | { status: 'needs_onboarding'; user: User }
  | { status: 'ready'; context: SessionContext; user: User };

/**
 * Single source of truth for auth + org context.
 * Wrapped in React cache() so layout + page + loaders share one DB round-trip per request.
 */
export const loadSession = cache(async (): Promise<SessionLoadResult> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: 'unauthenticated' };

  // Profile+org embed and membership in parallel (one fewer round-trip).
  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'full_name, organization_id, organizations(id, name, org_type, slug, onboarding_completed)'
      )
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('organization_members')
      .select('organization_id, role_id, roles(name)')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  if (!profile?.organization_id) {
    return { status: 'needs_onboarding', user };
  }

  const orgEmbed = profile.organizations as
    | {
        id: string;
        name: string;
        org_type: string;
        slug: string;
        onboarding_completed: boolean;
      }
    | {
        id: string;
        name: string;
        org_type: string;
        slug: string;
        onboarding_completed: boolean;
      }[]
    | null;
  const org = Array.isArray(orgEmbed) ? orgEmbed[0] : orgEmbed;
  if (!org) return { status: 'needs_onboarding', user };

  const roleRelation =
    membershipResult.data?.organization_id === org.id
      ? (membershipResult.data.roles as
          | { name: string }
          | { name: string }[]
          | null
          | undefined)
      : null;
  const roleName = Array.isArray(roleRelation)
    ? roleRelation[0]?.name ?? null
    : roleRelation?.name ?? null;

  return {
    status: 'ready',
    user,
    context: {
      userId: user.id,
      email: user.email ?? '',
      fullName: profile.full_name,
      organizationId: org.id,
      orgName: org.name,
      orgType: org.org_type as OrgType,
      orgSlug: org.slug,
      onboardingCompleted: Boolean(org.onboarding_completed),
      roleName,
    },
  };
});

/** Signed-in user required (onboarding allowed). */
export async function requireUser(): Promise<User> {
  const result = await loadSession();
  if (result.status === 'unauthenticated') redirect('/login');
  return result.user;
}

/** Signed-in user + organization required (app shell routes). */
export async function requireSessionContext(): Promise<SessionContext> {
  const result = await loadSession();
  if (result.status === 'unauthenticated') redirect('/login');
  if (result.status === 'needs_onboarding') redirect('/onboarding');
  return result.context;
}

/** Server Actions: session + fresh supabase client. */
export async function requireActionContext(): Promise<ActionContext> {
  const result = await loadSession();
  if (result.status === 'unauthenticated') redirect('/login');
  if (result.status === 'needs_onboarding') redirect('/onboarding');

  return {
    ...result.context,
    user: result.user,
    supabase: createClient(),
  };
}
