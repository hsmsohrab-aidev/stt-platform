import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { JourneyStrip } from '@/components/charts/stat-charts';
import { HubBanner } from '@/components/layout/hub-banner';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { canActAsAuditor, canActAsBrand } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import { loadVerificationHubData } from '@/lib/dashboard/loaders';
import { createClient } from '@/lib/supabase/server';
import {
  ClipboardCheck,
  FileText,
  Inbox,
  ShieldCheck,
} from 'lucide-react';

const statusClass: Record<string, string> = {
  open: 'bg-stt-purple-soft text-stt-purple',
  assigned: 'bg-stt-blue-soft text-stt-blue',
  in_progress: 'bg-stt-amber-soft text-stt-amber',
  completed: 'bg-stt-green-soft text-stt-green-dark',
  cancelled: 'bg-[#EDF1F6] text-stt-muted',
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
  const openJobs = hub.requests.filter((r) => r.status === 'open');
  const mineJobs = hub.requests.filter((r) =>
    hub.myAssignments.some((a) => a.request_id === r.id)
  );

  const hasOpen = hub.kpis.open > 0;
  const hasActive = hub.kpis.active > 0;
  const hasReport = (reports ?? []).length > 0;
  const hasVerified = hub.kpis.completed > 0;

  return (
    <PageWrapper
      title="Auditor Hub"
      description="Job board · reports · assignments — trust desk, not a donut dashboard"
      actions={
        <div className="flex items-center gap-2">
          {ctx.orgType === 'platform_admin' ? (
            <Badge className="rounded-full bg-stt-purple-soft text-stt-purple">
              Super Admin
            </Badge>
          ) : null}
          <Button asChild className="h-8 rounded-[9px] bg-stt-purple text-xs hover:bg-[#6B3FB8]">
            <Link href="/verification">Open marketplace</Link>
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
      <HubBanner
        tone="auditor"
        title="Auditor desk"
        subtitle="Claim open jobs, finish assignments, publish attested reports. This is not Brand or Supplier — it is the trust queue."
        links={[
          { href: '/verification?tab=open', label: 'Open jobs' },
          { href: '/verification?tab=mine', label: 'Mine' },
          { href: '/risk', label: 'Risk signals' },
        ]}
        stats={[
          { label: 'Open', value: hub.kpis.open },
          { label: 'Active', value: hub.kpis.active },
          { label: 'Done', value: hub.kpis.completed },
          { label: 'Reports', value: (reports ?? []).length },
        ]}
      />

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

      {/* Job board columns — unique layout */}
      <div className="mb-3.5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-stt-purple/25 bg-[#FAF7FD] shadow-[var(--stt-shadow)]">
          <div className="flex items-center gap-2 border-b border-stt-purple/15 px-4 py-3">
            <Inbox className="size-4 text-stt-purple" />
            <h3 className="text-[13px] font-bold">Open queue</h3>
            <Badge className="ml-auto rounded-full bg-stt-purple-soft text-stt-purple">
              {openJobs.length}
            </Badge>
          </div>
          <ul className="max-h-[340px] space-y-2 overflow-y-auto p-3">
            {openJobs.length === 0 ? (
              <li className="py-6 text-center text-[12px] text-stt-muted">Queue clear.</li>
            ) : (
              openJobs.slice(0, 8).map((j) => (
                <li
                  key={j.id}
                  className="rounded-xl border border-white bg-white px-3 py-2.5 shadow-sm"
                >
                  <div className="font-mono-stt text-[11px] font-semibold text-stt-purple">
                    {j.request_number}
                  </div>
                  <div className="mt-0.5 text-[11px] capitalize text-stt-muted">
                    {j.verification_type?.replace(/_/g, ' ')}
                  </div>
                  <div className="mt-1 text-[10px] text-stt-faint">
                    {nameById.get(j.buyer_org_id) ?? 'Buyer'} →{' '}
                    {nameById.get(j.supplier_org_id) ?? 'Supplier'}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
            <ClipboardCheck className="size-4 text-stt-blue" />
            <h3 className="text-[13px] font-bold">My assignments</h3>
            <Badge className="ml-auto rounded-full bg-stt-blue-soft text-stt-blue">
              {mineJobs.length || hub.myAssignments.length}
            </Badge>
          </div>
          <ul className="max-h-[340px] space-y-2 overflow-y-auto p-3">
            {hub.myAssignments.length === 0 ? (
              <li className="py-6 text-center text-[12px] text-stt-muted">
                {isAuditor
                  ? 'Claim an open job in Marketplace.'
                  : brandLike
                    ? 'Auditors claim jobs; you create them from Verification.'
                    : 'No assignments.'}
              </li>
            ) : (
              hub.myAssignments.map((a) => {
                const req = hub.requests.find((r) => r.id === a.request_id);
                return (
                  <li
                    key={a.id}
                    className="rounded-xl border border-stt-line bg-[#F8FAFC] px-3 py-2.5"
                  >
                    <div className="font-mono-stt text-[11px] text-stt-blue">
                      {req?.request_number ?? a.request_id.slice(0, 8)}
                    </div>
                    <Badge
                      className={`mt-1 rounded-full text-[10px] ${
                        statusClass[a.status] ?? statusClass.assigned
                      }`}
                    >
                      {a.status}
                    </Badge>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
            <FileText className="size-4 text-stt-green-dark" />
            <h3 className="text-[13px] font-bold">Report gallery</h3>
          </div>
          <div className="max-h-[340px] space-y-2 overflow-y-auto p-3">
            {(reports ?? []).length === 0 ? (
              <p className="py-6 text-center text-[12px] text-stt-muted">
                Publish from Verification after claim.
              </p>
            ) : (
              (reports ?? []).slice(0, 8).map((r) => (
                <Link
                  key={r.id}
                  href="/verification?tab=completed"
                  className="block rounded-xl border border-stt-line bg-[#F7FBFA] px-3 py-2.5 transition hover:border-stt-green/40"
                >
                  <div className="text-[12px] font-bold leading-snug text-stt-ink">
                    {r.report_title}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge className="rounded-full bg-stt-blue-soft text-[10px] text-stt-blue">
                      {r.overall_rating ?? '—'}
                    </Badge>
                    {r.score != null ? (
                      <Badge className="font-mono-stt rounded-full bg-[#EDF1F6] text-[10px]">
                        {r.score}
                      </Badge>
                    ) : null}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D9C8F0] bg-stt-purple-soft/40 px-4 py-3 text-[12px] leading-relaxed text-[#5B3A8C]">
        <ShieldCheck className="mr-1 inline size-3.5" />
        Pass / pass-with-conditions reports show as{' '}
        <b>Audit verified</b> on Brand Hub supplier cards. Complete work in{' '}
        <Link href="/verification" className="font-semibold underline">
          Verification marketplace
        </Link>
        .
      </div>
    </PageWrapper>
  );
}
