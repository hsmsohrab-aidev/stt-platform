'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export type AcceptInviteState = {
  error: string | null;
  success?: string;
};

export async function acceptInviteAction(
  token: string
): Promise<AcceptInviteState> {
  const user = await requireUser();
  const supabase = createClient();

  const { data: invite } = await supabase
    .from('invitations')
    .select('id, organization_id, email, role_id, accepted_at, expires_at, token')
    .eq('token', token)
    .maybeSingle();

  if (!invite) return { error: 'Invite not found.' };
  if (invite.accepted_at) return { error: 'Invite already accepted.' };
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: 'Invite has expired.' };
  }

  // Allow accepting even if email doesn't match (pilot); warn via success copy later
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.organization_id && profile.organization_id !== invite.organization_id) {
    return {
      error:
        'You already belong to another organization. Use a different account for this invite.',
    };
  }

  if (!profile?.organization_id) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ organization_id: invite.organization_id })
      .eq('id', user.id);
    if (profileError) return { error: profileError.message };
  }

  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', invite.organization_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role_id: invite.role_id,
      is_owner: false,
    });
    if (memberError) return { error: memberError.message };
  }

  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  redirect('/');
}
