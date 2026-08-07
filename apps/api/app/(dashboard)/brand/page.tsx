import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { LinkSupplierForm } from '@/app/(dashboard)/brand/link-supplier-form';
import {
  BarChart,
  DonutChart,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
import { InteractiveOverview } from '@/components/dashboard/interactive-overview';
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
import { canActAsBrand } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import { loadBrandDashboardData } from '@/lib/dashboard/loaders';
import { loadInteractiveOverview } from '@/lib/dashboard/overview';
import { createClient } from '@/lib/supabase/server';

export default async function BrandDashboardPage() {
  const ctx = await requireSessionContext();
  const brandLike = canActAsBrand(ctx.orgType);
  const supabase = createClient();
  const overview = await loadInteractiveOverview(ctx);

  if (!brandLike) {
    return (
      <PageWrapper
        title="Brand Hub"
        description={`${ctx.orgName} · brand workspace requires a brand or Super Admin account`}
      >
        <div className="rounded-xl border border-stt-line bg-white p-4 text-[13px] text-stt-muted shadow-[var(--stt-shadow)]">
          Open{' '}
          <Link href="/orders" className="font-semibold text-stt-blue hover:underline">
            Orders
          </Link>
          ,{' '}
          <Link href="/supply-chain" className="font-semibold text-stt-blue hover:underline">
            Supply Chain
          </Link>{' '}
          or{' '}
          <Link href="/supplier" className="font-semibold text-stt-blue hover:underline">
            Supplier Hub
          </Link>{' '}
          for your role view.
        </div>
      </PageWrapper>
    );
  }

  const data = await loadBrandDashboardData(ctx);

  const [{ data: orders }, { data: shipments }, { data: vrs }] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, order_number, po_number, status, total_quantity, quantity_unit, season, supplier_org_id'
      )
      .eq('buyer_org_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('shipments')
      .select('id, shipment_number, status, origin_port, destination_port')
      .or(
        `organization_id.eq.${ctx.organizationId},consignee_org_id.eq.${ctx.organizationId}`
      )
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('verification_requests')
      .select('id, request_number, status, verification_type, supplier_org_id')
      .eq('buyer_org_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  const orderRows = orders ?? [];
  const shipmentRows = shipments ?? [];
  const vrRows = vrs ?? [];
  const tierData = countBy(data.suppliers, (s) => s.tier_level ?? '—');
  const orderStatus = countBy(orderRows, (o) => o.status ?? '—');
  const tcStatus = countBy(data.recentTcs, (t) => t.tc_status ?? '—');

  return (
    <PageWrapper
      title="Brand Hub"
      description={`${ctx.orgName} · suppliers · orders · certificates · map`}
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

      <StatBoxes
        items={[
          { label: 'Suppliers', value: data.summary.totalSuppliers, hint: 'Linked' },
          { label: 'Active orders', value: data.summary.activeOrders },
          { label: 'Pending TCs', value: data.summary.pendingTCs },
          { label: 'Risk score', value: data.summary.riskScore, hint: 'Lower better' },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-3">
        <DonutChart title="Supplier tiers" data={tierData} />
        <DonutChart title="Order status" data={orderStatus} />
        <BarChart title="Inbound TC status" data={tcStatus} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Linked suppliers</h3>
              <Button asChild variant="outline" className="ml-auto h-7 rounded-[9px] text-[10px]">
                <Link href="/supply-chain">Chain map</Link>
              </Button>
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
                      No suppliers linked — use the form on the right.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.suppliers.map((s) => {
                    const org = s.organizations;
                    const name = Array.isArray(org) ? org[0]?.name : org?.name;
                    return (
                      <TableRow key={s.id} className="hover:bg-[#F7FAFC]">
                        <TableCell>
                          <Link
                            href="/supplier"
                            className="text-[12px] font-semibold text-stt-blue hover:underline"
                          >
                            {name ?? s.supplier_org_id.slice(0, 8)}
                          </Link>
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
              <h3 className="text-[13.5px] font-bold">Purchase orders</h3>
              <Button asChild variant="outline" className="ml-auto h-7 rounded-[9px] text-[10px]">
                <Link href="/orders">All</Link>
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Order</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  orderRows.map((o) => (
                    <TableRow key={o.id} className="hover:bg-[#F7FAFC]">
                      <TableCell>
                        <Link
                          href={`/orders/${o.id}`}
                          className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                        >
                          {o.po_number ?? o.order_number}
                        </Link>
                        <div className="text-[10px] text-stt-muted">{o.season ?? '—'}</div>
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

        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <h3 className="mb-3 text-[13.5px] font-bold">＋ Link supplier</h3>
            <LinkSupplierForm />
          </div>

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Received TCs</h3>
              <Link
                href="/tc"
                className="ml-auto text-[11px] font-semibold text-stt-blue hover:underline"
              >
                Inbox →
              </Link>
            </div>
            <ul className="divide-y divide-stt-line">
              {data.recentTcs.length === 0 ? (
                <li className="px-4 py-5 text-[12px] text-stt-muted">No inbound TCs.</li>
              ) : (
                data.recentTcs.slice(0, 12).map((tc) => (
                  <li key={tc.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <Link
                      href={`/tc/${tc.id}`}
                      className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                    >
                      {tc.tc_number}
                    </Link>
                    <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                      {tc.tc_status}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Shipments</h3>
              <Link
                href="/shipments"
                className="ml-auto text-[11px] font-semibold text-stt-blue hover:underline"
              >
                Track →
              </Link>
            </div>
            <ul className="divide-y divide-stt-line">
              {shipmentRows.length === 0 ? (
                <li className="px-4 py-5 text-[12px] text-stt-muted">No shipments.</li>
              ) : (
                shipmentRows.slice(0, 10).map((s) => (
                  <li key={s.id} className="px-4 py-2.5">
                    <Link
                      href={`/shipments/${s.id}`}
                      className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                    >
                      {s.shipment_number}
                    </Link>
                    <div className="text-[11px] text-stt-muted">
                      {[s.origin_port, s.destination_port].filter(Boolean).join(' → ') ||
                        s.status}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Verification</h3>
              <Link
                href="/verification"
                className="ml-auto text-[11px] font-semibold text-stt-blue hover:underline"
              >
                Open →
              </Link>
            </div>
            <ul className="divide-y divide-stt-line">
              {vrRows.length === 0 ? (
                <li className="px-4 py-5 text-[12px] text-stt-muted">No requests.</li>
              ) : (
                vrRows.slice(0, 8).map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div>
                      <div className="font-mono-stt text-[11px] text-stt-ink">
                        {v.request_number}
                      </div>
                      <div className="text-[10px] text-stt-muted">{v.verification_type}</div>
                    </div>
                    <Badge className="rounded-full bg-stt-purple-soft text-stt-purple">
                      {v.status}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
