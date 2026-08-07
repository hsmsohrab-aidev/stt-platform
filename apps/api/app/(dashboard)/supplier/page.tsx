import { logoutAction } from '@/app/(auth)/actions';
import { SupplierDashboard } from '@/components/dashboard/supplier-dashboard';
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
import { requireSessionContext } from '@/lib/auth/session';
import {
  loadBrandDashboardData,
  loadSupplierDashboardData,
} from '@/lib/dashboard/loaders';

export default async function SupplierDashboardPage() {
  const ctx = await requireSessionContext();

  if (ctx.orgType === 'supplier') {
    const data = await loadSupplierDashboardData(ctx);
    return (
      <PageWrapper
        title="Supplier Hub"
        description={`${ctx.orgName} · facilities & issued TCs`}
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

  // Brand / auditor — show linked suppliers (no bounce to home)
  if (ctx.orgType === 'brand') {
    const data = await loadBrandDashboardData(ctx);
    return (
      <PageWrapper
        title="Supplier Hub"
        description={`${ctx.orgName} · your linked suppliers`}
        actions={
          <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
            Viewing as brand
          </Badge>
        }
      >
        <div className="mb-3 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11.5px] text-[#1E4FA8]">
          Brand account — listing suppliers linked to you (same network as Brand Hub).
        </div>
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">
              Linked suppliers · {data.suppliers.length}
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Supplier</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Tier</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No suppliers linked yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.suppliers.map((s) => {
                  const org = s.organizations;
                  const name = Array.isArray(org) ? org[0]?.name : org?.name;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-[12px] font-semibold">
                        {name ?? s.supplier_org_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {s.tier_level}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                          {s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Supplier Hub"
      description={`${ctx.orgName} · ${ctx.orgType}`}
      actions={
        <form action={logoutAction}>
          <Button type="submit" variant="outline" className="h-8 rounded-[9px] text-xs">
            Sign out
          </Button>
        </form>
      }
    >
      <div className="rounded-xl border border-stt-line bg-white p-4 text-[12.5px] text-stt-muted shadow-[var(--stt-shadow)]">
        Supplier facilities and TCs appear when you are logged in as a supplier org. Use Demo
        Data or open Facilities / TC from the sidebar.
      </div>
    </PageWrapper>
  );
}
