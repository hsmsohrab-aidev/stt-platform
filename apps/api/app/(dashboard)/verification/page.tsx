import { ClaimRequestButton } from '@/app/(dashboard)/verification/claim-button';
import { CompleteVerificationForm } from '@/app/(dashboard)/verification/complete-form';
import { CreateVerificationForm } from '@/app/(dashboard)/verification/create-form';
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

const statusClass: Record<string, string> = {
  open: 'rounded-full bg-stt-purple-soft text-stt-purple',
  assigned: 'rounded-full bg-stt-blue-soft text-stt-blue',
  in_progress: 'rounded-full bg-stt-amber-soft text-stt-amber',
  completed: 'rounded-full bg-stt-green-soft text-stt-green-dark',
  cancelled: 'rounded-full bg-[#EDF1F6] text-stt-muted',
};

export default async function VerificationPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: requests } = await supabase
    .from('verification_requests')
    .select(
      'id, request_number, verification_type, scope, status, standards, deadline_date, budget_max_usd, buyer_org_id, supplier_org_id, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50);

  const orgIds = Array.from(
    new Set(
      (requests ?? []).flatMap((r) => [r.buyer_org_id, r.supplier_org_id])
    )
  );
  const { data: orgs } =
    orgIds.length > 0
      ? await supabase.from('organizations').select('id, name').in('id', orgIds)
      : { data: [] };
  const nameById = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  let suppliers: { id: string; name: string }[] = [];
  if (ctx.orgType === 'brand') {
    const { data: rels } = await supabase
      .from('supplier_relationships')
      .select('supplier_org_id')
      .eq('brand_org_id', ctx.organizationId)
      .eq('status', 'active');
    const ids = (rels ?? []).map((r) => r.supplier_org_id);
    if (ids.length > 0) {
      const { data: supplierOrgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', ids)
        .order('name');
      suppliers = (supplierOrgs ?? []).map((o) => ({ id: o.id, name: o.name }));
    }
  }

  let myAssignments: {
    id: string;
    request_id: string;
    status: string;
  }[] = [];
  if (ctx.orgType === 'auditor') {
    const { data } = await supabase
      .from('verification_assignments')
      .select('id, request_id, status')
      .eq('auditor_org_id', ctx.organizationId)
      .in('status', ['assigned', 'accepted', 'completed']);
    myAssignments = data ?? [];
  }
  const assignmentByRequest = new Map(
    myAssignments.map((a) => [a.request_id, a])
  );

  const { data: reports } = await supabase
    .from('audit_reports')
    .select('id, request_id, report_title, overall_rating, score, published_at')
    .order('created_at', { ascending: false })
    .limit(20);
  const reportByRequest = new Map((reports ?? []).map((r) => [r.request_id, r]));

  return (
    <PageWrapper
      title="Verification"
      description={
        ctx.orgType === 'auditor'
          ? 'Marketplace · claim open jobs · publish reports'
          : ctx.orgType === 'brand'
            ? 'Request audits on linked suppliers'
            : 'Verification requests involving your org'
      }
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[12.5px] font-bold">Requests</h3>
              <Badge className="ml-auto rounded-full bg-stt-purple-soft text-stt-purple">
                {requests?.length ?? 0}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase text-stt-faint">VR</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Parties</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(requests ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-[12px] text-stt-muted">
                      No verification requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (requests ?? []).map((r) => {
                    const assignment = assignmentByRequest.get(r.id);
                    const report = reportByRequest.get(r.id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-mono-stt text-[11px] text-stt-blue">
                            {r.request_number}
                          </div>
                          <div className="text-[10px] text-stt-muted">
                            {r.verification_type}
                            {r.scope ? ` · ${r.scope}` : ''}
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px]">
                          <div>
                            Buyer: {nameById.get(r.buyer_org_id) ?? '—'}
                          </div>
                          <div className="text-stt-muted">
                            Supplier: {nameById.get(r.supplier_org_id) ?? '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusClass[r.status] ?? statusClass.open}>
                            {r.status}
                          </Badge>
                          {report ? (
                            <div className="mt-1 text-[10px] text-stt-muted">
                              {report.overall_rating}
                              {report.score != null ? ` · ${report.score}` : ''}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {ctx.orgType === 'auditor' && r.status === 'open' ? (
                            <ClaimRequestButton requestId={r.id} />
                          ) : null}
                          {ctx.orgType === 'auditor' &&
                          assignment &&
                          assignment.status !== 'completed' &&
                          r.status === 'in_progress' ? (
                            <span className="text-[10px] font-semibold text-stt-green-dark">
                              Yours · complete →
                            </span>
                          ) : null}
                          {ctx.orgType !== 'auditor' ? '—' : null}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {ctx.orgType === 'auditor'
            ? myAssignments
                .filter((a) => a.status !== 'completed')
                .map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]"
                  >
                    <h3 className="mb-3 text-[12.5px] font-bold">
                      Complete assignment
                    </h3>
                    <CompleteVerificationForm
                      assignmentId={a.id}
                      requestId={a.request_id}
                    />
                  </div>
                ))
            : null}
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          {ctx.orgType === 'brand' ? (
            <>
              <div className="border-b border-stt-line px-4 py-3">
                <h3 className="text-[12.5px] font-bold">＋ New request</h3>
              </div>
              <div className="p-4">
                <CreateVerificationForm suppliers={suppliers} />
              </div>
            </>
          ) : (
            <div className="p-4 text-[12px] text-stt-muted">
              {ctx.orgType === 'auditor'
                ? 'Claim open requests from the list, then publish an audit report.'
                : 'Brands create verification requests. You will be notified when one involves your org.'}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
