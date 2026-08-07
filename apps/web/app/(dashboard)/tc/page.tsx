import { redirect } from 'next/navigation';
import { IssueTcForm } from '@/app/(dashboard)/tc/issue-form';
import { VerifyTcButton } from '@/app/(dashboard)/tc/verify-button';
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
import { createClient } from '@/lib/supabase/server';

export default async function TcPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.organization_id) redirect('/onboarding');
  const orgId = profile.organization_id;

  const { data: materials } = await supabase
    .from('materials')
    .select('id, name, standard')
    .eq('is_active', true)
    .order('name');

  const { data: tcs } = await supabase
    .from('transaction_certificates')
    .select(
      'id, tc_number, tc_status, total_quantity, quantity_unit, issue_date, receiver_org_id, issuer_org_id'
    )
    .or(
      `organization_id.eq.${orgId},issuer_org_id.eq.${orgId},receiver_org_id.eq.${orgId}`
    )
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <PageWrapper
      title="Transaction Certificates"
      description="Mass-balance enforced · every transfer certified"
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Issued / received TCs</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">TC</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Date</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tcs ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[12px] text-stt-muted">
                    No certificates yet.
                  </TableCell>
                </TableRow>
              ) : (
                (tcs ?? []).map((tc) => {
                  const canVerify =
                    tc.receiver_org_id === orgId && tc.tc_status === 'issued';
                  return (
                    <TableRow key={tc.id}>
                      <TableCell className="font-mono-stt text-[11px] text-stt-blue">
                        {tc.tc_number}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                          {tc.tc_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {Number(tc.total_quantity ?? 0).toLocaleString()}{' '}
                        {tc.quantity_unit}
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {tc.issue_date}
                      </TableCell>
                      <TableCell>
                        {canVerify ? <VerifyTcButton tcId={tc.id} /> : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">＋ Issue TC</h3>
          </div>
          <div className="p-4">
            <IssueTcForm materials={materials ?? []} />
            <p className="mt-3 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11px] text-[#1E4FA8]">
              Receiver must be an existing organization UUID (shown on supplier
              dashboard). PDF/QR generation is next polish.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
