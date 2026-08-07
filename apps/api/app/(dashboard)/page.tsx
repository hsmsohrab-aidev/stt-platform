import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { BrandDashboard } from '@/components/dashboard/brand-dashboard';
import { InteractiveOverview } from '@/components/dashboard/interactive-overview';
import { SupplierDashboard } from '@/components/dashboard/supplier-dashboard';
import {
  InsightCard,
  StatBoxes,
} from '@/components/charts/stat-charts';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { canActAsBrand } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import {
  loadBrandDashboardData,
  loadSupplierDashboardData,
} from '@/lib/dashboard/loaders';
import { loadInteractiveOverview } from '@/lib/dashboard/overview';
import { loadOrgRiskSnapshot } from '@/lib/risk/derive';
import { loadOrgSustainabilitySnapshot } from '@/lib/sustainability/derive';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function loadExecKpis(orgId: string, orgType: string) {
  const supabase = createClient();
  const [
    { data: orders },
    { data: shipments },
    risk,
    sust,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, total_quantity')
      .or(
        `organization_id.eq.${orgId},buyer_org_id.eq.${orgId},supplier_org_id.eq.${orgId}`
      )
      .limit(80),
    supabase
      .from('shipments')
      .select('id, status')
      .or(
        `organization_id.eq.${orgId},shipper_org_id.eq.${orgId},consignee_org_id.eq.${orgId}`
      )
      .limit(80),
    loadOrgRiskSnapshot(orgId, orgType as never),
    loadOrgSustainabilitySnapshot(orgId, orgType as never),
  ]);

  const orderRows = orders ?? [];
  const shipRows = shipments ?? [];
  const delivered = orderRows.filter((o) => o.status === 'delivered').length;
  const onTimePct =
    orderRows.length === 0
      ? 100
      : Math.min(
          100,
          Math.round(
            ((delivered +
              orderRows.filter((o) =>
                ['shipped', 'confirmed', 'in_production'].includes(o.status)
              ).length *
                0.55) /
              orderRows.length) *
              100
          )
        );
  const qtyTotal = orderRows.reduce(
    (s, o) => s + Number(o.total_quantity ?? 0),
    0
  );
  // Proxy spend until unit prices are complete — labeled as volume proxy
  const spendProxy = Math.round(qtyTotal * 4.85);

  return {
    onTimePct,
    orderCount: orderRows.length,
    spendProxy,
    highRisk: risk.highCount,
    co2e: sust.totalCarbonKg,
    topFlag: risk.flags[0] ?? null,
    exceptionShips: shipRows.filter((s) => s.status === 'exception').length,
  };
}

export default async function HomePage() {
  const ctx = await requireSessionContext();
  const overview = await loadInteractiveOverview(ctx);
  const kpis = await loadExecKpis(ctx.organizationId, ctx.orgType);

  const insight = kpis.topFlag
    ? {
        title: kpis.topFlag.title,
        body: kpis.topFlag.description,
        href: kpis.topFlag.href,
      }
    : kpis.exceptionShips > 0
      ? {
          title: `${kpis.exceptionShips} shipment exception(s)`,
          body: 'Review exception queue in Order Intelligence and clear delays before ETA slips.',
          href: '/orders',
        }
      : {
          title: 'Supply chain operating normally',
          body: 'No critical risk flags. Keep verifying inbound TCs and publishing passports.',
          href: '/risk',
        };

  const kpiStrip = (
    <>
      <StatBoxes
        items={[
          { label: 'On-time signal', value: `${kpis.onTimePct}%` },
          { label: 'Total orders', value: kpis.orderCount },
          {
            label: 'Volume proxy',
            value: `$${(kpis.spendProxy / 1000).toFixed(1)}k`,
            hint: 'qty × rate',
          },
          { label: 'High risk', value: kpis.highRisk },
        ]}
      />
      <div className="mb-3.5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]">
          <div className="text-[11px] font-semibold text-stt-muted">CO₂e (passport sum)</div>
          <div className="mt-1 font-display text-[24px] font-bold text-stt-ink">
            {kpis.co2e > 0 ? kpis.co2e.toLocaleString() : '—'}
            <span className="ml-1 text-[12px] font-normal text-stt-muted">kg</span>
          </div>
        </div>
        <InsightCard
          title={insight.title}
          body={insight.body}
          href={insight.href}
          hrefLabel="Investigate →"
        />
      </div>
    </>
  );

  if (canActAsBrand(ctx.orgType)) {
    const data = await loadBrandDashboardData(ctx);
    return (
      <PageWrapper
        title="Executive Overview"
        description={`${ctx.orgName} · ${ctx.orgType === 'platform_admin' ? 'Super Admin' : 'Brand'} · insights & journey`}
        actions={
          <div className="flex items-center gap-2">
            {ctx.orgType === 'platform_admin' ? (
              <Badge className="rounded-full bg-stt-purple-soft text-stt-purple">
                Super Admin
              </Badge>
            ) : null}
            <Button
              asChild
              variant="outline"
              className="h-8 rounded-[9px] text-xs font-semibold"
            >
              <Link href="/brand">Brand hub</Link>
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
        {kpiStrip}
        <div className="mb-3.5">
          <InteractiveOverview {...overview} />
        </div>
        <BrandDashboard
          orgName={ctx.orgName}
          orgId={ctx.organizationId}
          summary={data.summary}
          suppliers={data.suppliers}
          recentTcs={data.recentTcs}
        />
      </PageWrapper>
    );
  }

  if (ctx.orgType === 'supplier') {
    const data = await loadSupplierDashboardData(ctx);
    return (
      <PageWrapper
        title="Executive Overview"
        description={`${ctx.orgName} · Supplier workspace · live map & journey`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="h-8 rounded-[9px] text-xs font-semibold"
            >
              <Link href="/supplier">Supplier hub</Link>
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
        {kpiStrip}
        <div className="mb-3.5">
          <InteractiveOverview {...overview} />
        </div>
        <SupplierDashboard
          orgName={ctx.orgName}
          orgId={ctx.organizationId}
          summary={data.summary}
          facilities={data.facilities}
          recentTcs={data.recentTcs}
        />
      </PageWrapper>
    );
  }

  if (ctx.orgType === 'auditor') {
    redirect('/auditor');
  }

  return (
    <PageWrapper
      title="Workspace"
      description={`${ctx.orgName} · ${ctx.orgType}`}
      actions={
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            className="h-8 rounded-[9px] text-xs font-semibold"
          >
            Sign out
          </Button>
        </form>
      }
    >
      {kpiStrip}
      <div className="mb-3.5">
        <InteractiveOverview {...overview} />
      </div>
    </PageWrapper>
  );
}
