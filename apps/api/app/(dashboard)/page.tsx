import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { InsightCard, StatBoxes } from '@/components/charts/stat-charts';
import { InteractiveOverview } from '@/components/dashboard/interactive-overview';
import { HubBanner } from '@/components/layout/hub-banner';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { canActAsBrand } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import { loadInteractiveOverview } from '@/lib/dashboard/overview';
import { loadOrgRiskSnapshot } from '@/lib/risk/derive';
import { loadOrgSustainabilitySnapshot } from '@/lib/sustainability/derive';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function loadExecKpis(orgId: string, orgType: string) {
  const supabase = createClient();
  const [{ data: orders }, { data: shipments }, risk, sust] = await Promise.all([
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
  if (ctx.orgType === 'auditor') redirect('/auditor');

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
          body: 'Clear delays in Order Intelligence before ETA slips.',
          href: '/orders',
        }
      : {
          title: 'Operating normally',
          body: 'No critical flags. Open a hub below for role work.',
          href: '/risk',
        };

  const hubLinks = canActAsBrand(ctx.orgType)
    ? [
        { href: '/brand', label: 'Brand hub' },
        { href: '/supplier', label: 'Supplier floor' },
        { href: '/auditor', label: 'Auditor desk' },
        { href: '/orders', label: 'Orders' },
      ]
    : ctx.orgType === 'supplier'
      ? [
          { href: '/supplier', label: 'Supplier floor' },
          { href: '/wallet', label: 'Wallet' },
          { href: '/tc', label: 'TCs' },
          { href: '/facilities', label: 'Facilities' },
        ]
      : [
          { href: '/orders', label: 'Orders' },
          { href: '/risk', label: 'Risk' },
        ];

  return (
    <PageWrapper
      title="Dashboard"
      description="One glance · live map · go to the right hub for work"
      actions={
        <div className="flex items-center gap-2">
          {ctx.orgType === 'platform_admin' ? (
            <Badge className="rounded-full bg-stt-purple-soft text-stt-purple">
              Super Admin
            </Badge>
          ) : null}
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
        tone="exec"
        title={ctx.orgName}
        subtitle="This page is the executive cockpit only — map, KPIs, and one insight. Role work lives in Brand / Supplier / Auditor hubs."
        links={hubLinks}
        stats={[
          { label: 'On-time', value: `${kpis.onTimePct}%` },
          { label: 'Orders', value: kpis.orderCount },
          { label: 'High risk', value: kpis.highRisk },
        ]}
      />

      <StatBoxes
        items={[
          {
            label: 'Volume proxy',
            value: `$${(kpis.spendProxy / 1000).toFixed(1)}k`,
            hint: 'qty × rate',
          },
          {
            label: 'CO₂e (passports)',
            value: kpis.co2e > 0 ? kpis.co2e.toLocaleString() : '—',
            hint: 'kg',
          },
          { label: 'Exceptions', value: kpis.exceptionShips },
          { label: 'Map pins', value: overview.pins.length },
        ]}
      />

      <div className="mb-3.5">
        <InsightCard
          title={insight.title}
          body={insight.body}
          href={insight.href}
          hrefLabel="Investigate →"
        />
      </div>

      <InteractiveOverview {...overview} />

      <p className="mt-3.5 text-center text-[11px] text-stt-muted">
        Need supplier network?{' '}
        <Link href="/brand" className="font-semibold text-stt-blue hover:underline">
          Brand hub
        </Link>
        {' · '}
        factory floor?{' '}
        <Link href="/supplier" className="font-semibold text-stt-blue hover:underline">
          Supplier hub
        </Link>
        {' · '}
        audits?{' '}
        <Link href="/auditor" className="font-semibold text-stt-blue hover:underline">
          Auditor hub
        </Link>
      </p>
    </PageWrapper>
  );
}
