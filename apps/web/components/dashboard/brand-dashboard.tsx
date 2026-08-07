import Link from 'next/link';
import type { BrandDashboardSummary } from '@stt/types';
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

type SupplierRow = {
  id: string;
  supplier_org_id: string;
  tier_level: string;
  status: string;
  organizations: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

type TcRow = {
  id: string;
  tc_number: string;
  tc_status: string;
  total_quantity: number | null;
  quantity_unit: string | null;
  issue_date: string;
  issuer_org_id: string;
};

type BrandDashboardProps = {
  orgName: string;
  orgId?: string;
  summary: BrandDashboardSummary;
  suppliers: SupplierRow[];
  recentTcs: TcRow[];
};

function orgNameFrom(rel: SupplierRow['organizations']): string {
  if (!rel) return '—';
  if (Array.isArray(rel)) return rel[0]?.name ?? '—';
  return rel.name;
}

export function BrandDashboard({
  orgName,
  orgId,
  summary,
  suppliers,
  recentTcs,
}: BrandDashboardProps) {
  const kpis: Array<[string, string | number, string]> = [
    ['Suppliers linked', summary.totalSuppliers, 'Supply chain'],
    ['Pending TCs', summary.pendingTCs, 'Awaiting verify'],
    ['Active orders', summary.activeOrders, 'Phase 2 module'],
    ['Open alerts', summary.openAlerts, 'Watchlist'],
  ];

  return (
    <div className="space-y-3.5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, hint]) => (
          <div
            key={label}
            className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
          >
            <div className="flex justify-between text-[10.5px] font-semibold text-stt-muted">
              <span>{label}</span>
              <span>{hint}</span>
            </div>
            <div className="mt-1 font-display text-[23px] font-bold text-stt-ink">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Supply chain — linked suppliers</h3>
            <Button
              asChild
              variant="outline"
              className="ml-auto h-7 rounded-[7px] text-[11px] font-semibold"
            >
              <Link href="/facilities">Manage chain</Link>
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
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No supplier relationships yet. Link suppliers from Supply Chain.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-[12px] font-semibold">
                      {orgNameFrom(s.organizations)}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Received TCs</h3>
            <Button
              asChild
              variant="outline"
              className="ml-auto h-7 rounded-[7px] text-[11px] font-semibold"
            >
              <Link href="/tc">Open TC inbox</Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">TC</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTcs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No inbound certificates for {orgName} yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentTcs.map((tc) => (
                  <TableRow key={tc.id}>
                    <TableCell className="font-mono-stt text-[11px] text-stt-blue">
                      {tc.tc_number}
                    </TableCell>
                    <TableCell>
                      <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
                        {tc.tc_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {Number(tc.total_quantity ?? 0).toLocaleString()}{' '}
                      {tc.quantity_unit}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2.5 text-[11px] leading-relaxed text-[#1E4FA8]">
        Brand view for <b>{orgName}</b>
        {orgId ? (
          <>
            {' '}
            · org id <span className="font-mono-stt">{orgId}</span>
          </>
        ) : null}
        . Compliance/risk scores populate in later phases.
      </div>
    </div>
  );
}
