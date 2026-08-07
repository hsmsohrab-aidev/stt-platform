import Link from 'next/link';
import { PrintTcButton } from '@/app/(dashboard)/tc/print-button';
import {
  DonutChart,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
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
import { createClient } from '@/lib/supabase/server';

export default async function ReportsPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();
  const orgId = ctx.organizationId;

  const [tcsRes, ordersRes, walletRes, facilitiesRes] = await Promise.all([
    supabase
      .from('transaction_certificates')
      .select('id, tc_number, tc_status, total_quantity, quantity_unit, issue_date')
      .or(
        `organization_id.eq.${orgId},issuer_org_id.eq.${orgId},receiver_org_id.eq.${orgId}`
      )
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('orders')
      .select('id, order_number, po_number, status, total_quantity, quantity_unit')
      .or(
        `organization_id.eq.${orgId},buyer_org_id.eq.${orgId},supplier_org_id.eq.${orgId}`
      )
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('material_wallets')
      .select('id')
      .eq('organization_id', orgId)
      .is('facility_id', null)
      .maybeSingle(),
    supabase
      .from('facilities')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
  ]);

  const wallet = walletRes.data;
  const { data: balances } = wallet
    ? await supabase
        .from('wallet_balances')
        .select('available_qty, materials(name)')
        .eq('wallet_id', wallet.id)
    : { data: [] };

  const tcs = tcsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const facilityCount = facilitiesRes.count ?? 0;
  const generatedAt = new Date().toLocaleString();
  const tcStatusData = countBy(tcs, (tc) => tc.tc_status ?? '—');
  const orderStatusData = countBy(orders, (o) => o.status ?? '—');

  return (
    <PageWrapper
      title="Reports"
      description="Pilot pack · print / save as PDF"
      actions={
        <div className="flex items-center gap-2 print:hidden">
          <PrintTcButton />
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/">Dashboard</Link>
          </Button>
        </div>
      }
    >
      <article className="space-y-3.5">
        <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)] print:border-0 print:shadow-none">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-stt-faint">
            STT Platform · Operations summary
          </p>
          <h2 className="mt-1 font-display text-[20px] font-bold text-stt-navy">
            {ctx.orgName}
          </h2>
          <p className="mt-1 text-[11.5px] text-stt-muted">
            {ctx.orgType} · generated {generatedAt}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
              {tcs.length} TCs
            </Badge>
            <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
              {orders.length} orders
            </Badge>
            <Badge className="rounded-full bg-[#EDF1F6] text-stt-muted">
              {facilityCount} facilities
            </Badge>
          </div>
        </div>

        <div className="print:hidden">
          <StatBoxes
            items={[
              { label: 'TCs', value: tcs.length },
              { label: 'Orders', value: orders.length },
              { label: 'Facilities', value: facilityCount },
              { label: 'Wallet lines', value: (balances ?? []).length },
            ]}
          />
          <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
            <DonutChart title="TC status mix" data={tcStatusData} />
            <DonutChart title="Order status mix" data={orderStatusData} />
          </div>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)] print:shadow-none">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Wallet snapshot</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Material</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(balances ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-[12px] text-stt-muted">
                    No balances.
                  </TableCell>
                </TableRow>
              ) : (
                (balances ?? []).map((b, i) => {
                  const mat = b.materials as
                    | { name: string }
                    | { name: string }[]
                    | null;
                  const name = Array.isArray(mat) ? mat[0]?.name : mat?.name;
                  return (
                    <TableRow key={i}>
                      <TableCell className="text-[12px]">{name ?? '—'}</TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {Number(b.available_qty).toLocaleString()} KG
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)] print:shadow-none">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Transaction certificates</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">TC</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tcs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-[12px] text-stt-muted">
                    No TCs.
                  </TableCell>
                </TableRow>
              ) : (
                tcs.map((tc) => (
                  <TableRow key={tc.id} className="hover:bg-[#F7FAFC]">
                    <TableCell className="font-mono-stt text-[11px] text-stt-blue">
                      <Link href={`/tc/${tc.id}`} className="hover:underline">
                        {tc.tc_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                        {tc.tc_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {Number(tc.total_quantity ?? 0).toLocaleString()} {tc.quantity_unit}
                    </TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {tc.issue_date}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)] print:shadow-none">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Orders</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Order</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">PO</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-[12px] text-stt-muted">
                    No orders.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-[#F7FAFC]">
                    <TableCell className="font-mono-stt text-[11px] text-stt-blue">
                      <Link href={`/orders/${o.id}`} className="hover:underline">
                        {o.order_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[12px]">{o.po_number ?? '—'}</TableCell>
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
      </article>
    </PageWrapper>
  );
}
