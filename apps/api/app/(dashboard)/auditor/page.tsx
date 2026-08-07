import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import {
  DonutChart,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { canActAsAuditor, canActAsBrand } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import { loadVerificationHubData } from '@/lib/dashboard/loaders';
import { createClient } from '@/lib/supabase/server';

const statusClass: Record<string, string> = {
  open: 'rounded-full bg-stt-purple-soft text-stt-purple',
  assigned: 'rounded-full bg-stt-blue-soft text-stt-blue',
  in_progress: 'rounded-full bg-stt-amber-soft text-stt-amber',
  completed: 'rounded-full bg-stt-green-soft text-stt-green-dark',
  cancelled: 'rounded-full bg-[#EDF1F6] text-stt-muted',
};

export default async function AuditorHubPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();
  const hub = await loadVerificationHubData(ctx);
  const isAuditor = canActAsAuditor(ctx.orgType);
  const brandLike = canActAsBrand(ctx.orgType);

  const orgIds = Array.from(
    new Set(hub.requests.flatMap((r) => [r.buyer_org_id, r.supplier_org_id]))
  );
  const [{ data: orgs }, { data: reports }] = await Promise.all([
    orgIds.length > 0
      ? supabase.from('organizations').select('id, name').in('id', orgIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase
      .from('audit_reports')
      .select(
        'id, request_id, report_title, overall_rating, score, published_at, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  const nameById = new Map((orgs ?? []).map((o) => [o.id, o.name]));
  const reportByRequest = new Map((reports ?? []).map((r) => [r.request_id, r]));
  const statusData = countBy(hub.requests, (r) => r.status ?? '—');
  const typeData = countBy(hub.requests, (r) => r.verification_type ?? '—');

  return (
    <PageWrapper
      title="Auditor Hub"
      description={
        isAuditor
          ? `${ctx.orgName} · marketplace · assignments · reports`
          : `${ctx.orgName} · verification jobs involving your organization`
      }
      actions={
        <div className="flex items-center gap-2">
          {ctx.orgType === 'platform_admin' ? (
            <Badge className="rounded-full bg-stt-purple-soft text-stt-purple">
              Super Admin
            </Badge>
          ) : null}
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/verification">Verification</Link>
          </Button>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              className="h-8 rounded-[9px] text-xs font-semibold"
            >
              Sign out
            </Button>
          </form>
        </div>
      }
    >
      <StatBoxes
        items={[
          { label: 'Total jobs', value: hub.kpis.total },
          { label: 'Open', value: hub.kpis.open, hint: 'Claimable' },
          { label: 'Active', value: hub.kpis.active },
          { label: 'Completed', value: hub.kpis.completed },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <DonutChart title="By status" data={statusData} />
        <DonutChart title="By verification type" data={typeData} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.45fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[13.5px] font-bold">
              {isAuditor ? 'Marketplace & jobs' : 'Your verification requests'}
            </h3>
            <Badge className="ml-auto rounded-full bg-stt-purple-soft text-stt-purple">
              {hub.requests.length}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">VR</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Parties</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Type</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hub.requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[12px] text-stt-muted">
                    No verification requests visible.
                    {brandLike ? (
                      <>
                        {' '}
                        Create one from{' '}
                        <Link
                          href="/verification"
                          className="font-semibold text-stt-blue hover:underline"
                        >
                          Verification
                        </Link>
                        .
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : (
                hub.requests.map((j) => {
                  const report = reportByRequest.get(j.id);
                  return (
                    <TableRow key={j.id} className="hover:bg-[#F7FAFC]">
                      <TableCell>
                        <Link
                          href="/verification"
                          className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                        >
                          {j.request_number}
                        </Link>
                        <div className="font-mono-stt text-[10px] text-stt-faint">
                          {j.deadline_date ?? 'No deadline'}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px]">
                        <div>{nameById.get(j.buyer_org_id) ?? 'Buyer'}</div>
                        <div className="text-stt-muted">
                          → {nameById.get(j.supplier_org_id) ?? 'Supplier'}
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]">{j.verification_type}</TableCell>
                      <TableCell>
                        <Badge className={statusClass[j.status] ?? statusClass.open}>
                          {j.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] text-stt-muted">
                        {report ? (
                          <span>
                            {report.overall_rating}
                            {report.score != null ? ` · ${report.score}` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <div className="border-t border-stt-line px-4 py-3">
            <Button
              asChild
              className="h-8 rounded-[9px] bg-stt-green text-xs hover:bg-stt-green-dark"
            >
              <Link href="/verification">Open Verification →</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Recent audit reports</h3>
            </div>
            <ul className="divide-y divide-stt-line">
              {(reports ?? []).length === 0 ? (
                <li className="px-4 py-5 text-[12px] text-stt-muted">
                  No published reports yet.
                </li>
              ) : (
                (reports ?? []).slice(0, 12).map((r) => (
                  <li key={r.id} className="px-4 py-2.5">
                    <div className="text-[12.5px] font-semibold text-stt-ink">
                      {r.report_title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-stt-muted">
                      {r.overall_rating}
                      {r.score != null ? ` · score ${r.score}` : ''}
                      {r.published_at
                        ? ` · ${new Date(r.published_at).toLocaleDateString()}`
                        : ''}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {hub.myAssignments.length > 0 ? (
            <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
              <div className="border-b border-stt-line px-4 py-3">
                <h3 className="text-[13.5px] font-bold">Your assignments</h3>
              </div>
              <ul className="divide-y divide-stt-line">
                {hub.myAssignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 px-4 py-2.5"
                  >
                    <span className="font-mono-stt text-[11px] text-stt-muted">
                      {a.request_id.slice(0, 8)}…
                    </span>
                    <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
                      {a.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-[#CCDCF9] bg-stt-blue-soft px-4 py-3 text-[12px] leading-relaxed text-[#1E4FA8]">
            Claim open jobs and publish reports from{' '}
            <Link href="/verification" className="font-semibold underline">
              Verification
            </Link>
            . Risk signals derived from these audits appear in{' '}
            <Link href="/risk" className="font-semibold underline">
              Risk Hub
            </Link>
            .
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
