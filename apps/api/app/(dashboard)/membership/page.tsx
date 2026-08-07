import { InviteForm } from '@/app/(dashboard)/membership/invite-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export default async function MembershipPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('id, user_id, is_owner, joined_at, roles(name)')
      .eq('organization_id', ctx.organizationId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('invitations')
      .select('id, email, token, accepted_at, expires_at, created_at')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
      : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <PageWrapper
      title="Membership"
      description={`${ctx.orgName} · team & invites`}
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[12.5px] font-bold">Members</h3>
              <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
                {members?.length ?? 0}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Person
                  </TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Role
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(members ?? []).map((m) => {
                  const p = profileById.get(m.user_id);
                  const role = m.roles as
                    | { name: string }
                    | { name: string }[]
                    | null;
                  const roleName = Array.isArray(role)
                    ? role[0]?.name
                    : role?.name;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="text-[12px] font-semibold">
                          {p?.full_name ?? 'User'}
                          {m.is_owner ? ' · Owner' : ''}
                        </div>
                        <div className="text-[10.5px] text-stt-muted">
                          {m.user_id.slice(0, 8)}…
                        </div>
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {roleName ?? '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="border-b border-stt-line px-4 py-3">
              <h3 className="text-[12.5px] font-bold">Pending invites</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Email
                  </TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Token
                  </TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invites ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                      No invites yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (invites ?? []).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="text-[12px]">{i.email}</TableCell>
                      <TableCell className="font-mono-stt text-[10px] text-stt-blue">
                        {i.accepted_at ? (
                          i.token.slice(0, 12) + '…'
                        ) : (
                          <a
                            href={`/invite/${i.token}`}
                            className="underline-offset-2 hover:underline"
                          >
                            /invite/{i.token.slice(0, 8)}…
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-[#EDF1F6] text-stt-muted">
                          {i.accepted_at ? 'Accepted' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">＋ Invite teammate</h3>
          </div>
          <div className="p-4">
            <InviteForm />
            <p className="mt-3 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11px] text-[#1E4FA8]">
              With <b>RESEND_API_KEY</b> set, invitees get an email. Otherwise share the{' '}
              <b>/invite/…</b> link from the pending table. Invitee must sign in with the
              invited email, then Accept & join.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
