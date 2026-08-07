import Link from 'next/link';
import {
  DonutChart,
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
import {
  loadOrgRiskSnapshot,
  type RiskSeverity,
} from '@/lib/risk/derive';

function severityBadge(severity: RiskSeverity) {
  if (severity === 'critical' || severity === 'high') {
    return 'bg-[#FDE8E8] text-[#B42318]';
  }
  if (severity === 'medium') {
    return 'bg-stt-amber-soft text-stt-amber';
  }
  return 'bg-[#EDF1F6] text-stt-muted';
}

export default async function RiskHubPage() {
  const ctx = await requireSessionContext();
  const snapshot = await loadOrgRiskSnapshot(ctx.organizationId, ctx.orgType);

  const kpis: Array<[string, string | number, string]> = [
    ['Risk score', snapshot.riskScore, '0 = clear'],
    ['High / critical', snapshot.highCount, 'Needs action'],
    ['Medium', snapshot.mediumCount, 'Watch'],
    ['Open flags', snapshot.openFlagCount, 'Derived'],
  ];

  const severityData = countBy(snapshot.flags, (f) => f.severity);

  return (
    <PageWrapper
      title="Risk Hub"
      description={`${ctx.orgName} · derived from live TC, verification, facilities & wallet`}
      actions={
        <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
          <Link href="/compliance">Compliance</Link>
        </Button>
      }
    >
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

        {severityData.length > 0 ? (
          <div className="grid gap-3.5 lg:grid-cols-2">
            <DonutChart title="Flags by severity" data={severityData} />
          </div>
        ) : null}

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Exception queue</h3>
            <Badge className="ml-auto rounded-full bg-stt-blue-soft text-stt-blue">
              {snapshot.openFlagCount}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">
                  Severity
                </TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">
                  Flag
                </TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">
                  Detail
                </TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">
                  Open
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.flags.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-[12px] text-stt-muted"
                  >
                    No open risk flags. Keep verifying TCs and renewing certs.
                  </TableCell>
                </TableRow>
              ) : (
                snapshot.flags.map((f) => (
                  <TableRow key={f.id} className="hover:bg-[#F7FAFC]">
                    <TableCell>
                      <Badge
                        className={`rounded-full capitalize ${severityBadge(f.severity)}`}
                      >
                        {f.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={f.href}
                        className="text-[12px] font-semibold text-stt-blue hover:underline"
                      >
                        {f.title}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[280px] text-[11px] text-stt-muted">
                      {f.description}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={f.href}
                        className="text-[11px] font-semibold text-stt-blue underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2.5 text-[11px] leading-relaxed text-[#1E4FA8]">
          Scores are weighted from live operations (unverified TCs, open
          verifications, cert expiry, facilities, wallet). Dedicated risk entity
          scoring + Hyperledger risk attestations come later.
        </p>
      </div>
    </PageWrapper>
  );
}
