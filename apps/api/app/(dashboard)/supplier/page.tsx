import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import {
  BarChart,
  DonutChart,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
import { InteractiveOverview } from '@/components/dashboard/interactive-overview';
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
import { canActAsBrand, canActAsSupplier } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import {
  loadBrandDashboardData,
  loadSupplierDashboardData,
} from '@/lib/dashboard/loaders';
import { loadInteractiveOverview } from '@/lib/dashboard/overview';
import { createClient } from '@/lib/supabase/server';

export default async function SupplierDashboardPage() {
  const ctx = await requireSessionContext();
  const overview = await loadInteractiveOverview(ctx);
  const supplierLike = canActAsSupplier(ctx.orgType);
  const brandLike = canActAsBrand(ctx.orgType);

  // Pure supplier org
  if (ctx.orgType === 'supplier') {
    const data = await loadSupplierDashboardData(ctx);
    return (
      <PageWrapper
        title="Supplier Hub"
        description={`${ctx.orgName} · facilities · wallet · issued TCs`}
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

  // Super Admin / brand: own ops + linked supplier network
  if (brandLike || supplierLike) {
    const [own, brandNet] = await Promise.all([
      loadSupplierDashboardData(ctx),
      loadBrandDashboardData(ctx),
    ]);
    const supabase = createClient();

    const supplierIds = brandNet.suppliers.map((s) => s.supplier_org_id);
    const [{ data: partnerFacilities }, { data: inboundOrders }] = await Promise.all([
      supplierIds.length
        ? supabase
            .from('facilities')
            .select('id, name, facility_type, tier_level, city, country, organization_id, is_verified')
            .in('organization_id', supplierIds)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(40)
        : Promise.resolve({ data: [] as Array<{
            id: string;
            name: string;
            facility_type: string;
            tier_level: string | null;
            city: string | null;
            country: string | null;
            organization_id: string;
            is_verified: boolean;
          }> }),
      supabase
        .from('orders')
        .select(
          'id, order_number, po_number, status, total_quantity, quantity_unit, supplier_org_id'
        )
        .eq('buyer_org_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

    const nameBySupplier = new Map(
      brandNet.suppliers.map((s) => {
        const org = s.organizations;
        const name = Array.isArray(org) ? org[0]?.name : org?.name;
        return [s.supplier_org_id, name ?? 'Supplier'] as const;
      })
    );

    const tierData = countBy(brandNet.suppliers, (s) => s.tier_level ?? '—');
    const facTypeData = countBy(own.facilities, (f) => f.facility_type ?? '—');
    const partnerFacType = countBy(partnerFacilities ?? [], (f) => f.facility_type ?? '—');

    return (
      <PageWrapper
        title="Supplier Hub"
        description={`${ctx.orgName} · your units + linked supplier network`}
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
        <div className="mb-3.5">
          <InteractiveOverview {...overview} />
        </div>

        <StatBoxes
          items={[
            { label: 'Own facilities', value: own.facilities.length },
            { label: 'Linked suppliers', value: brandNet.suppliers.length },
            { label: 'Partner facilities', value: (partnerFacilities ?? []).length },
            { label: 'Issued TCs (you)', value: own.summary.issuedTCs },
          ]}
        />

        <div className="mb-3.5 grid gap-3.5 lg:grid-cols-3">
          <DonutChart title="Your facility types" data={facTypeData} />
          <DonutChart title="Supplier tiers" data={tierData} />
          <BarChart title="Partner facility mix" data={partnerFacType} />
        </div>

        <div className="mb-3.5">
          <SupplierDashboard
            orgName={ctx.orgName}
            orgId={ctx.organizationId}
            summary={own.summary}
            facilities={own.facilities}
            recentTcs={own.recentTcs}
          />
        </div>

        <div className="grid gap-3.5 lg:grid-cols-2">
          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Linked suppliers</h3>
              <Link
                href="/brand"
                className="ml-auto text-[11px] font-semibold text-stt-blue hover:underline"
              >
                Brand hub →
              </Link>
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
                {brandNet.suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                      No suppliers linked yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  brandNet.suppliers.map((s) => {
                    const org = s.organizations;
                    const name = Array.isArray(org) ? org[0]?.name : org?.name;
                    return (
                      <TableRow key={s.id} className="hover:bg-[#F7FAFC]">
                        <TableCell className="text-[12px] font-semibold text-stt-ink">
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

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Partner facilities</h3>
              <Link
                href="/supply-chain"
                className="ml-auto text-[11px] font-semibold text-stt-blue hover:underline"
              >
                Map →
              </Link>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Facility</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Supplier</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Loc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(partnerFacilities ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                      Partners have not declared facilities yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (partnerFacilities ?? []).map((f) => (
                    <TableRow key={f.id} className="hover:bg-[#F7FAFC]">
                      <TableCell>
                        <div className="text-[12px] font-semibold">{f.name}</div>
                        <div className="text-[10px] text-stt-muted">{f.facility_type}</div>
                      </TableCell>
                      <TableCell className="text-[11px] text-stt-muted">
                        {nameBySupplier.get(f.organization_id) ?? '—'}
                      </TableCell>
                      <TableCell className="text-[11px] text-stt-muted">
                        {[f.city, f.country].filter(Boolean).join(', ') || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)] lg:col-span-2">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Orders to suppliers</h3>
              <Link
                href="/orders"
                className="ml-auto text-[11px] font-semibold text-stt-blue hover:underline"
              >
                All orders →
              </Link>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Order</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Supplier</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(inboundOrders ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-[12px] text-stt-muted">
                      No purchase orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  (inboundOrders ?? []).map((o) => (
                    <TableRow key={o.id} className="hover:bg-[#F7FAFC]">
                      <TableCell>
                        <Link
                          href={`/orders/${o.id}`}
                          className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                        >
                          {o.po_number ?? o.order_number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        {o.supplier_org_id
                          ? nameBySupplier.get(o.supplier_org_id) ?? '—'
                          : '—'}
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {Number(o.total_quantity ?? 0).toLocaleString()} {o.quantity_unit}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
                          {o.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Supplier Hub" description={`${ctx.orgName} · ${ctx.orgType}`}>
      <div className="rounded-xl border border-stt-line bg-white p-4 text-[13px] text-stt-muted shadow-[var(--stt-shadow)]">
        Open{' '}
        <Link href="/facilities" className="font-semibold text-stt-blue hover:underline">
          Facilities
        </Link>{' '}
        or{' '}
        <Link href="/tc" className="font-semibold text-stt-blue hover:underline">
          Transaction Certificates
        </Link>{' '}
        from the sidebar.
      </div>
    </PageWrapper>
  );
}
