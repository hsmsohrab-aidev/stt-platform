import { logoutAction } from '@/app/(auth)/actions';
import { BrandDashboard } from '@/components/dashboard/brand-dashboard';
import { SupplierDashboard } from '@/components/dashboard/supplier-dashboard';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireSessionContext } from '@/lib/auth/session';
import {
  loadBrandDashboardData,
  loadSupplierDashboardData,
} from '@/lib/dashboard/loaders';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const ctx = await requireSessionContext();

  if (ctx.orgType === 'brand') {
    const data = await loadBrandDashboardData(ctx);
    return (
      <PageWrapper
        title="Executive Overview"
        description={`${ctx.orgName} · Brand workspace`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="h-8 rounded-[9px] text-xs font-semibold"
            >
              <a href="/brand">Brand hub</a>
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
        description={`${ctx.orgName} · Supplier workspace`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="h-8 rounded-[9px] text-xs font-semibold"
            >
              <a href="/supplier">Supplier hub</a>
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

  // Other roles — compact overview until dedicated dashboards
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
      <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-[18px] font-bold">{ctx.orgName}</h2>
          <Badge className="rounded-full bg-stt-purple-soft text-stt-purple">
            {ctx.orgType}
          </Badge>
          {ctx.roleName ? (
            <Badge className="rounded-full bg-[#EDF1F6] text-stt-muted">
              {ctx.roleName}
            </Badge>
          ) : null}
        </div>
        <p className="mt-2 text-[12px] text-stt-muted">
          Dedicated {ctx.orgType} dashboard modules ship in later phases. Use Supply
          Chain and TC screens for assigned work.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <a href="/tc">Transaction certificates</a>
          </Button>
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <a href="/facilities">Facilities</a>
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
