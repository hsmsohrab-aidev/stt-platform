import { logoutAction } from '@/app/(auth)/actions';
import { BrandDashboard } from '@/components/dashboard/brand-dashboard';
import { InteractiveOverview } from '@/components/dashboard/interactive-overview';
import { SupplierDashboard } from '@/components/dashboard/supplier-dashboard';
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
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const ctx = await requireSessionContext();
  const overview = await loadInteractiveOverview(ctx);

  if (canActAsBrand(ctx.orgType)) {
    const data = await loadBrandDashboardData(ctx);
    return (
      <PageWrapper
        title="Executive Overview"
        description={`${ctx.orgName} · ${ctx.orgType === 'platform_admin' ? 'Super Admin' : 'Brand'} · live map & journey`}
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
      <div className="mb-3.5">
        <InteractiveOverview {...overview} />
      </div>
      <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-[19px] font-bold">{ctx.orgName}</h2>
          <Badge className="rounded-full bg-stt-purple-soft text-stt-purple">
            {ctx.orgType}
          </Badge>
        </div>
        <p className="mt-2 text-[13px] text-stt-muted">
          Dedicated {ctx.orgType} modules ship later. Use the map above and Operate menus.
        </p>
      </div>
    </PageWrapper>
  );
}
