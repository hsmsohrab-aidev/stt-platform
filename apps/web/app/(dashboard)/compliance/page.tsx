import Link from 'next/link';
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
  STANDARDS_READINESS,
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

export default async function CompliancePage() {
  const ctx = await requireSessionContext();
  const snapshot = await loadOrgRiskSnapshot(ctx.organizationId, ctx.orgType);
  const tasks = snapshot.flags.filter((f) => f.category === 'compliance');

  const kpis: Array<[string, string | number, string]> = [
    ['Compliance score', snapshot.complianceScore, '100 = clear'],
    ['Open tasks', tasks.length, 'From ops'],
    ['Critical / high', tasks.filter((t) => t.severity === 'critical' || t.severity === 'high').length, 'Priority'],
    ['Standards map', STANDARDS_READINESS.length, 'Label set'],
  ];

  return (
    <PageWrapper
      title="Compliance"
      description={`${ctx.orgName} · evidence queue + standards readiness`}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/verification">Verification</Link>
          </Button>
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/risk">Risk Hub</Link>
          </Button>
        </div>
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

        <div className="grid gap-3.5 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[12.5px] font-bold">Compliance tasks</h3>
              <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
                {tasks.length}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Severity
                  </TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Task
                  </TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-[12px] text-stt-muted"
                    >
                      No open compliance tasks from TC, certs, or verification.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Badge
                          className={`rounded-full capitalize ${severityBadge(t.severity)}`}
                        >
                          {t.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-[12px] font-semibold text-stt-ink">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-stt-muted">
                          {t.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={t.href}
                          className="text-[11px] font-semibold text-stt-blue underline-offset-2 hover:underline"
                        >
                          Resolve
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="border-b border-stt-line px-4 py-3">
              <h3 className="text-[12.5px] font-bold">Standards readiness</h3>
              <p className="mt-0.5 text-[11px] text-stt-muted">
                Label map for pilots — full regulation library later
              </p>
            </div>
            <ul className="divide-y divide-stt-line">
              {STANDARDS_READINESS.map((s) => (
                <li key={s.code} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full bg-stt-navy/10 font-mono-stt text-stt-navy">
                      {s.code}
                    </Badge>
                    <span className="text-[12px] font-semibold text-stt-ink">
                      {s.name}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-stt-muted">{s.focus}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
