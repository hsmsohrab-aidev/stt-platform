import { redirect } from 'next/navigation';
import { acceptInviteAction } from '@/app/invite/actions';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

type PageProps = {
  params: { token: string };
};

export default async function AcceptInvitePage({ params }: PageProps) {
  const user = await requireUser();
  const supabase = createClient();

  // Invites are org-scoped RLS — use service-like read via token match may fail for outsiders.
  // Policy: invitee may not see invite until we add public token select. Use RPC-safe select:
  const { data: invite } = await supabase
    .from('invitations')
    .select('id, email, organization_id, accepted_at, expires_at, token')
    .eq('token', params.token)
    .maybeSingle();

  // If RLS blocks, try listing won't work — need policy for token lookup
  if (!invite) {
    return (
      <PageWrapper title="Invite" description="Team invitation" standalone>
        <div className="mx-auto max-w-md rounded-xl border border-stt-line bg-white p-6 shadow-[var(--stt-shadow)]">
          <h2 className="font-display text-lg font-bold">Invite unavailable</h2>
          <p className="mt-2 text-[12px] text-stt-muted">
            This invite token is invalid, expired, or not visible to your account. Ask
            the admin to re-issue, or sign in with the invited email.
          </p>
          <p className="mt-2 text-[11px] text-stt-faint">Signed in as {user.email}</p>
        </div>
      </PageWrapper>
    );
  }

  if (invite.accepted_at) redirect('/');

  const { data: org } = await supabase
    .from('organizations')
    .select('name, org_type')
    .eq('id', invite.organization_id)
    .maybeSingle();

  return (
    <PageWrapper title="Accept invite" description="Join organization" standalone>
      <div className="mx-auto max-w-md rounded-xl border border-stt-line bg-white p-6 shadow-[var(--stt-shadow)]">
        <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
          Invitation
        </Badge>
        <h2 className="mt-3 font-display text-[20px] font-bold text-stt-ink">
          {org?.name ?? 'Organization'}
        </h2>
        <p className="mt-1 text-[12px] text-stt-muted">
          Invited email: <b>{invite.email}</b>
          {org?.org_type ? ` · ${org.org_type}` : ''}
        </p>
        <p className="mt-2 text-[11.5px] text-stt-muted">
          You are signed in as <b>{user.email}</b>. Accepting will add you to this org.
        </p>
        <form
          className="mt-4"
          action={async () => {
            'use server';
            await acceptInviteAction(params.token);
          }}
        >
          <Button
            type="submit"
            className="h-9 w-full rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
          >
            Accept & join
          </Button>
        </form>
      </div>
    </PageWrapper>
  );
}
