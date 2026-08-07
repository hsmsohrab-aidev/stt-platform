import { logoutAction } from '@/app/(auth)/actions';
import { SupplierDashboard } from '@/components/dashboard/supplier-dashboard';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { requireSessionContext } from '@/lib/auth/session';
import { loadSupplierDashboardData } from '@/lib/dashboard/loaders';
import { redirect } from 'next/navigation';

export default async function SupplierDashboardPage() {
  const ctx = await requireSessionContext();
  if (ctx.orgType !== 'supplier') redirect('/');

  const data = await loadSupplierDashboardData(ctx);

  return (
    <PageWrapper
      title="Supplier Dashboard"
      description={`${ctx.orgName} · facility membership workspace`}
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
