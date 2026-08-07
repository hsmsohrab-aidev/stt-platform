import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import {
  DonutChart,
  JourneyStrip,
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
        'id, request_id, report_title, overall_rating, score, published_at, created_at, is_published'
      )
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  const nameById = new Map((orgs ?? []).map((o) => [o.id, o.name]));
  const reportByRequest = new Map((reports ?? []).map((r) => [r.request_id, r]));
  const statusData = countBy(hub.requests, (r) => r.status ?? '—');
  const typeData = countBy(hub.requests, (r) => r.verification_type ?? '—');

  const hasOpen = hub.kpis.open > 0;
  const hasActive = hub.kpis.active > 0;
  const hasReport = (reports ?? []).length > 0;
  const hasVerified = hub.kpis.completed > 0;

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
            <Link href="/verification">Marketplace</Link>
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
      <JourneyStrip
        steps={[
          { label: 'Request', done: hub.kpis.total > 0 },
          {
            label: 'Marketplace',
            done: hasOpen || hasActive || hasVerified,
            current: hasOpen && !hasActive,
          },
          {
            label: 'Auditor',
            done: hasActive || hasVerified,
            current: hasActive,
          },
          {
            label: 'Report',
            done: hasReport,
            current: hasReport && !hasVerified,
          },
          { label: 'Verified', done: hasVerified, current: hasVerified },
        ]}
      />

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

      <div className="mb-3.5 rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[13.5px] font-bold">Digital report gallery</h3>
          <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
            {(reports ?? []).length}
          </Badge>
        </div>
        {(reports ?? []).length === 0 ? (
          <p className="px-4 py-6 text-center text-[12px] text-stt-muted">
            No reports yet. Complete an assignment in{' '}
            <Link href="/verification" className="font-semibold text-stt-blue hover:underline">
              Verification
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {(reports ?? []).map((r) => (
              <Link
                key={r.id}
                href="/verification?tab=completed"
                className="rounded-xl border border-stt-line bg-[#F8FAFC] p-3 transition hover:border-stt-green/50 hover:shadow-[var(--stt-shadow)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[12.5px] font-bold leading-snug text-stt-ink">
                    {r.report_title}
                  </div>
                  {r.is_published ? (
                    <Badge className="shrink-0 rounded-full bg-stt-green-soft text-[9px] text-stt-green-dark">
                      Published
                    </Badge>
                  ) : (
                    <Badge className="shrink-0 rounded-full bg-stt-amber-soft text-[9px] text-stt-amber">
                      Draft
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge className="rounded-full bg-stt-blue-soft text-[10px] text-stt-blue">
                    {r.overall_rating ?? '—'}
                  </Badge>
                  {r.score != null ? (
                    <Badge className="font-mono-stt rounded-full bg-[#EDF1F6] text-[10px] text-stt-navy">
                      Score {r.score}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-2 font-mono-stt text-[10px] text-stt-faint">
                  {r.published_at
                    ? new Date(r.published_at).toLocaleDateString()
                    : new Date(r.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
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
                      <TableCell className="text-[12px] capitalize">
                        {j.verification_type?.replace(/_/g, ' ')}
                      </TableCell>
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
              <Link href="/verification">Open Marketplace →</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-3.5">
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
                    <Link
                      href="/verification?tab=mine"
                      className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                    >
                      {a.request_id.slice(0, 8)}…
                    </Link>
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
