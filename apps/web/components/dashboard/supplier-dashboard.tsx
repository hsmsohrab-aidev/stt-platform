import Link from 'next/link';
import type { SupplierDashboardSummary } from '@stt/types';
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

type FacilityRow = {
  id: string;
  name: string;
  facility_type: string;
  tier_level: string | null;
  city: string | null;
  is_verified: boolean;
};

type TcRow = {
  id: string;
  tc_number: string;
  tc_status: string;
  total_quantity: number | null;
  quantity_unit: string | null;
  issue_date: string;
};

type SupplierDashboardProps = {
  orgName: string;
  orgId?: string;
  summary: SupplierDashboardSummary;
  facilities: FacilityRow[];
  recentTcs: TcRow[];
};

export function SupplierDashboard({
  orgName,
  orgId,
  summary,
  facilities,
  recentTcs,
}: SupplierDashboardProps) {
  return (
    <div className="space-y-3.5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.walletBalance.length === 0 ? (
          <div className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)] sm:col-span-2">
            <div className="text-[10.5px] font-semibold text-stt-muted">Wallet</div>
            <div className="mt-1 font-display text-[18px] font-bold">Empty</div>
            <p className="mt-1 text-[11px] text-stt-muted">
              Credit materials to activate mass-balance tracking.
            </p>
          </div>
        ) : (
          summary.walletBalance.slice(0, 4).map((w) => (
            <div
              key={w.material}
              className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
            >
              <div className="text-[10.5px] font-semibold text-stt-muted">{w.material}</div>
              <div className="mt-1 font-display text-[21px] font-bold text-stt-ink">
                {w.available_qty.toLocaleString()}{' '}
                <span className="text-[11px] text-stt-muted">{w.unit}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Issued TCs', summary.issuedTCs],
          ['Compliance tasks', summary.complianceTasks],
          ['High priority', summary.overdueTasksCount],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
          >
            <div className="text-[10.5px] font-semibold text-stt-muted">{label}</div>
            <div className="mt-1 font-display text-[23px] font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          asChild
          className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
        >
          <Link href="/wallet">Open wallet</Link>
        </Button>
        <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs font-semibold">
          <Link href="/tc">Issue TC</Link>
        </Button>
        <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs font-semibold">
          <Link href="/facilities">Declare facility</Link>
        </Button>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Facilities — {orgName}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Name</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Type</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No facilities declared.
                  </TableCell>
                </TableRow>
              ) : (
                facilities.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="text-[12px] font-semibold">{f.name}</TableCell>
                    <TableCell className="text-[12px]">{f.facility_type}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          f.is_verified
                            ? 'rounded-full bg-stt-green-soft text-stt-green-dark'
                            : 'rounded-full bg-[#EDF1F6] text-stt-muted'
                        }
                      >
                        {f.is_verified ? 'Verified' : 'Declared'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Recently issued TCs</h3>
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
                    No TCs issued yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentTcs.map((tc) => (
                  <TableRow key={tc.id}>
                    <TableCell className="font-mono-stt text-[11px] text-stt-blue">
                      {tc.tc_number}
                    </TableCell>
                    <TableCell>
                      <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                        {tc.tc_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {Number(tc.total_quantity ?? 0).toLocaleString()} {tc.quantity_unit}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {orgId ? (
        <div className="rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11px] text-[#1E4FA8]">
          Share this org id with brands for linking / TC receive:{' '}
          <span className="font-mono-stt">{orgId}</span>
        </div>
      ) : null}
    </div>
  );
}
