import { CompleteVerificationForm } from '@/app/(dashboard)/verification/complete-form';
import { CreateVerificationForm } from '@/app/(dashboard)/verification/create-form';
import {
  DonutChart,
  JourneyStrip,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
import { MarketplaceBoard } from '@/components/verification/marketplace-board';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { requireSessionContext } from '@/lib/auth/session';
import { canActAsAuditor, canActAsBrand } from '@/lib/auth/capabilities';
import { loadVerificationHubData } from '@/lib/dashboard/loaders';
import { createClient } from '@/lib/supabase/server';

export default async function VerificationPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const ctx = await requireSessionContext();
  const tabParam = searchParams?.tab;
  const initialTab =
    tabParam === 'mine' ||
    tabParam === 'completed' ||
    tabParam === 'all' ||
    tabParam === 'open'
      ? tabParam
      : 'open';
  const supabase = createClient();
  const hub = await loadVerificationHubData(ctx);
  const requests = hub.requests;

  const orgIds = Array.from(
    new Set(requests.flatMap((r) => [r.buyer_org_id, r.supplier_org_id]))
  );
  const { data: orgs } =
    orgIds.length > 0
      ? await supabase.from('organizations').select('id, name').in('id', orgIds)
      : { data: [] };
  const nameById = Object.fromEntries((orgs ?? []).map((o) => [o.id, o.name]));

  let suppliers: { id: string; name: string }[] = [];
  if (canActAsBrand(ctx.orgType)) {
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

  const myAssignments = hub.myAssignments;
  const assignmentByRequest = Object.fromEntries(
    myAssignments.map((a) => [a.request_id, { id: a.id, status: a.status }])
  );
  const myRequestIds = myAssignments.map((a) => a.request_id);

  const { data: reports } = await supabase
    .from('audit_reports')
    .select('id, request_id, report_title, overall_rating, score, published_at')
    .order('created_at', { ascending: false })
    .limit(40);
  const reportByRequest = Object.fromEntries(
    (reports ?? []).map((r) => [
      r.request_id,
      {
        request_id: r.request_id,
        overall_rating: r.overall_rating,
        score: r.score,
      },
    ])
  );

  const brandLike = canActAsBrand(ctx.orgType);
  const auditorLike = canActAsAuditor(ctx.orgType);
  const statusData = countBy(requests, (r) => r.status ?? '—');
  const typeData = countBy(requests, (r) => r.verification_type ?? '—');

  const hasRequest = hub.kpis.total > 0;
  const hasOpen = hub.kpis.open > 0;
  const hasActive = hub.kpis.active > 0;
  const hasReport = (reports ?? []).length > 0;
  const hasVerified = hub.kpis.completed > 0;

  return (
    <PageWrapper
      title="Verification Marketplace"
      description={
        ctx.orgType === 'platform_admin'
          ? 'Super Admin · create requests and claim marketplace jobs'
          : auditorLike && !brandLike
            ? 'Marketplace · claim open jobs · publish reports'
            : brandLike
              ? 'Request audits on linked suppliers'
              : 'Verification requests involving your organization'
      }
    >
      <JourneyStrip
        steps={[
          { label: 'Request', done: hasRequest, current: !hasRequest },
          {
            label: 'Marketplace',
            done: hasOpen || hasActive || hasVerified,
            current: hasOpen && !hasActive,
          },
          {
            label: 'Auditor',
            done: hasActive || hasVerified,
            current: hasActive && !hasVerified,
          },
          {
            label: 'Report',
            done: hasReport || hasVerified,
            current: hasReport && !hasVerified,
          },
          { label: 'Verified', done: hasVerified, current: hasVerified },
        ]}
      />

      <StatBoxes
        items={[
          { label: 'Total', value: hub.kpis.total },
          { label: 'Open', value: hub.kpis.open, hint: 'Claimable' },
          { label: 'Active', value: hub.kpis.active },
          { label: 'Completed', value: hub.kpis.completed },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <DonutChart title="By status" data={statusData} />
        <DonutChart title="By service type" data={typeData} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-3.5">
          <MarketplaceBoard
            requests={requests.map((r) => ({
              id: r.id,
              request_number: r.request_number,
              buyer_org_id: r.buyer_org_id,
              supplier_org_id: r.supplier_org_id,
              verification_type: r.verification_type,
              scope: r.scope,
              status: r.status,
              deadline_date: r.deadline_date,
            }))}
            nameById={nameById}
            myRequestIds={myRequestIds}
            assignmentByRequest={assignmentByRequest}
            reportByRequest={reportByRequest}
            auditorLike={auditorLike}
            orgId={ctx.organizationId}
            initialTab={initialTab}
          />

          {auditorLike
            ? myAssignments
                .filter((a) => a.status !== 'completed')
                .map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]"
                  >
                    <h3 className="mb-3 text-[12.5px] font-bold">Complete assignment</h3>
                    <CompleteVerificationForm
                      assignmentId={a.id}
                      requestId={a.request_id}
                    />
                  </div>
                ))
            : null}
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          {brandLike ? (
            <>
              <div className="border-b border-stt-line px-4 py-3">
                <h3 className="text-[12.5px] font-bold">New request</h3>
              </div>
              <div className="p-4">
                <CreateVerificationForm suppliers={suppliers} />
              </div>
            </>
          ) : (
            <div className="p-4 text-[12px] leading-relaxed text-stt-muted">
              {auditorLike
                ? 'Use Open tab to claim jobs, Mine for your assignments, Completed for published reports.'
                : 'You see every verification that lists your org as supplier (or buyer). Brands create new requests; auditors claim and complete them.'}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
