import Link from 'next/link';
import { PrintTcButton } from '@/app/(dashboard)/tc/print-button';
import {
  DonutChart,
  FilterBar,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
import { CsvExportButton } from '@/components/reports/csv-export-button';
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
import { loadOrgRiskSnapshot } from '@/lib/risk/derive';
import { createClient } from '@/lib/supabase/server';

const CATALOG = [
  {
    id: 'ops',
    name: 'Operations summary',
    category: 'Operational',
    href: '#ops-pack',
    format: 'PDF / CSV',
  },
  {
    id: 'risk',
    name: 'Enterprise risk summary',
    category: 'Risk',
    href: '/risk',
    format: 'Live · CSV',
  },
  {
    id: 'compliance',
    name: 'Compliance status report',
    category: 'Compliance',
    href: '/compliance',
    format: 'Live',
  },
  {
    id: 'esg',
    name: 'Sustainability / ESG pack',
    category: 'ESG',
    href: '/sustainability',
    format: 'Live',
  },
  {
    id: 'tc',
    name: 'Transaction certificate register',
    category: 'Operational',
    href: '/tc',
    format: 'CSV',
  },
  {
    id: 'orders',
    name: 'Order performance',
    category: 'Operational',
    href: '/orders',
    format: 'CSV',
  },
] as const;

export default async function ReportsPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();
  const orgId = ctx.organizationId;
  const risk = await loadOrgRiskSnapshot(orgId, ctx.orgType);

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
  const catalogByCat = countBy([...CATALOG], (c) => c.category);

  const tcCsvRows = tcs.map((tc) => [
    tc.tc_number,
    tc.tc_status,
    tc.total_quantity,
    tc.quantity_unit,
    tc.issue_date,
  ]);
  const orderCsvRows = orders.map((o) => [
    o.order_number,
    o.po_number,
    o.status,
    o.total_quantity,
    o.quantity_unit,
  ]);
  const riskCsvRows = risk.flags.map((f) => [
    f.severity,
    f.kind,
    f.title,
    f.description,
    f.href,
  ]);

  return (
    <PageWrapper
      title="Reports & Dashboards"
      description="See clearly · report confidently · export & share"
      actions={
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <PrintTcButton />
          <CsvExportButton
            filename={`stt-tcs-${orgId.slice(0, 8)}`}
            headers={['TC', 'Status', 'Qty', 'Unit', 'Issue date']}
            rows={tcCsvRows}
            label="Export TCs CSV"
          />
          <CsvExportButton
            filename={`stt-orders-${orgId.slice(0, 8)}`}
            headers={['Order', 'PO', 'Status', 'Qty', 'Unit']}
            rows={orderCsvRows}
            label="Export Orders CSV"
          />
          <CsvExportButton
            filename={`stt-risk-${orgId.slice(0, 8)}`}
            headers={['Severity', 'Kind', 'Title', 'Detail', 'Href']}
            rows={riskCsvRows}
            label="Export Risk CSV"
          />
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/">Dashboard</Link>
          </Button>
        </div>
      }
    >
      <FilterBar
        items={[
          { label: 'Formats', value: 'PDF · CSV' },
          { label: 'Catalog', value: `${CATALOG.length} packs` },
          { label: 'Generated', value: generatedAt.split(',')[0] ?? 'Now' },
        ]}
      />

      <StatBoxes
        items={[
          { label: 'Report packs', value: CATALOG.length },
          { label: 'TCs in register', value: tcs.length },
          { label: 'Orders', value: orders.length },
          { label: 'Open risk flags', value: risk.openFlagCount },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2 print:hidden">
        <DonutChart title="Catalog by category" data={catalogByCat} />
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[13.5px] font-bold">Report catalog</h3>
          </div>
          <ul className="divide-y divide-stt-line">
            {CATALOG.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div>
                  <div className="text-[12.5px] font-semibold text-stt-ink">{c.name}</div>
                  <div className="text-[10.5px] text-stt-muted">
                    {c.category} · {c.format}
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="h-7 rounded-[9px] text-[11px]"
                >
                  <Link href={c.href}>Generate</Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <article id="ops-pack" className="space-y-3.5">
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
          <div className="flex items-center border-b border-stt-line px-4 py-3">
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
