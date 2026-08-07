import { logoutAction } from '@/app/(auth)/actions';
import { LinkSupplierForm } from '@/app/(dashboard)/brand/link-supplier-form';
import { BrandDashboard } from '@/components/dashboard/brand-dashboard';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { requireSessionContext } from '@/lib/auth/session';
import { loadBrandDashboardData } from '@/lib/dashboard/loaders';
import { redirect } from 'next/navigation';

export default async function BrandDashboardPage() {
  const ctx = await requireSessionContext();
  if (ctx.orgType !== 'brand') redirect('/');

  const data = await loadBrandDashboardData(ctx);

  return (
    <PageWrapper
      title="Brand Dashboard"
      description={`${ctx.orgName} · buyer / brand workspace`}
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
      <BrandDashboard
        orgName={ctx.orgName}
        orgId={ctx.organizationId}
        summary={data.summary}
        suppliers={data.suppliers}
        recentTcs={data.recentTcs}
      />

      <div className="mt-3.5 max-w-md rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
        <h3 className="mb-3 text-[12.5px] font-bold">＋ Link supplier</h3>
        <LinkSupplierForm />
      </div>
    </PageWrapper>
  );
}
