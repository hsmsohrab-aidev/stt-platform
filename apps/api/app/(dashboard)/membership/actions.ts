'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';

export type InviteActionState = {
  error: string | null;
  success?: string;
};

export async function inviteMemberAction(
  _prev: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  if (!email || !email.includes('@')) {
    return { error: 'Valid email is required.' };
  }

  const { supabase, organizationId, userId, orgType } = await requireActionContext();

  const roleName =
    orgType === 'brand'
      ? 'brand_viewer'
      : orgType === 'supplier'
        ? 'supplier_operator'
        : orgType === 'auditor'
          ? 'auditor_field'
          : 'brand_viewer';

  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .maybeSingle();

  const { data: invite, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: organizationId,
      email,
      role_id: role?.id ?? null,
      invited_by: userId,
    })
    .select('id, token, email')
    .single();

  if (error || !invite) {
    return { error: error?.message ?? 'Invite failed.' };
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .maybeSingle();

  const { sendInviteEmail } = await import('@/lib/email/notify');
  const mail = await sendInviteEmail({
    to: email,
    orgName: org?.name ?? 'your organization',
    roleName,
    token: invite.token,
    organizationId,
    inviteId: invite.id,
  }).catch(() => ({
    sent: false,
    detail: 'Email helper failed',
  }));

  await supabase.from('notifications').insert({
    organization_id: organizationId,
    title: mail.sent
      ? `Invite emailed · ${email}`
      : `Invite created · ${email}`,
    body: `Role ${roleName}. ${mail.detail}`,
    severity: 'info',
    module: 'membership',
    entity_type: 'invitation',
    entity_id: invite.id,
    action_url: '/membership',
    channel: mail.sent ? 'email' : 'in_app',
  });

  revalidatePath('/membership');
  revalidatePath('/alerts');
  return {
    error: null,
    success: mail.sent
      ? `Invite emailed to ${email} (${roleName}).`
      : `Invite ready for ${email} (${roleName}). ${mail.detail}`,
  };
}
