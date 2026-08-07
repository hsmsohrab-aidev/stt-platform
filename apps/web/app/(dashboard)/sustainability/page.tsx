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
  FRAMEWORK_REPORTS,
  loadOrgSustainabilitySnapshot,
  type SustainabilityPriority,
} from '@/lib/sustainability/derive';

function statusBadge(status: SustainabilityPriority['status']) {
  if (status === 'done' || status === 'on_track') {
    return 'bg-stt-green-soft text-stt-green-dark';
  }
  if (status === 'at_risk') {
    return 'bg-[#FDE8E8] text-[#B42318]';
  }
  return 'bg-stt-amber-soft text-stt-amber';
}

function statusLabel(status: SustainabilityPriority['status']) {
  if (status === 'on_track') return 'On track';
  if (status === 'at_risk') return 'At risk';
  if (status === 'in_progress') return 'In progress';
  return 'Done';
}

export default async function SustainabilityPage() {
  const ctx = await requireSessionContext();
  const snap = await loadOrgSustainabilitySnapshot(
    ctx.organizationId,
    ctx.orgType
  );

  const kpis: Array<[string, string | number, string]> = [
    ['Sustainability score', snap.score, 'Derived'],
    [
      'CO₂e (passport sum)',
      snap.totalCarbonKg > 0 ? snap.totalCarbonKg.toLocaleString() : '—',
      'kg',
    ],
    [
      'Water (passport sum)',
      snap.totalWaterL > 0 ? snap.totalWaterL.toLocaleString() : '—',
      'L',
    ],
    [
      'Published DPPs',
      snap.publishedPassports,
      `${snap.draftPassports} draft`,
    ],
  ];

  return (
    <PageWrapper
      title="Sustainability"
      description={`${ctx.orgName} · DPP footprints + ops coverage (GRI/CSRD-ready labels)`}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/dpp">Product passports</Link>
          </Button>
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/compliance">Compliance</Link>
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

        <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[12.5px] font-bold">Top priorities</h3>
              <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
                {snap.priorities.length}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Priority
                  </TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Progress
                  </TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] uppercase text-stt-faint">
                    Open
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snap.priorities.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-[12px] text-stt-muted"
                    >
                      No open sustainability priorities.
                    </TableCell>
                  </TableRow>
                ) : (
                  snap.priorities.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="text-[12px] font-semibold text-stt-ink">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-stt-muted">
                          {p.target}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#EDF1F6]">
                          <div
                            className="h-full rounded-full bg-stt-green"
                            style={{
                              width: `${clampProgress(p.progress)}%`,
                            }}
                          />
                        </div>
                        <div className="font-mono-stt mt-1 text-[10px] text-stt-faint">
                          {clampProgress(p.progress)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-full ${statusBadge(p.status)}`}
                        >
                          {statusLabel(p.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={p.href}
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

          <div className="space-y-3.5">
            <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
              <div className="border-b border-stt-line px-4 py-3">
                <h3 className="text-[12.5px] font-bold">Measured metrics</h3>
              </div>
              <ul className="divide-y divide-stt-line">
                {snap.metrics.length === 0 ? (
                  <li className="px-4 py-6 text-center text-[12px] text-stt-muted">
                    Add carbon/water on DPP to populate metrics.
                  </li>
                ) : (
                  snap.metrics.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-start justify-between gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold capitalize text-stt-ink">
                          {m.metric}
                        </div>
                        <div className="text-[10px] text-stt-faint">
                          {m.source}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-stt text-[12px] font-semibold text-stt-ink">
                          {m.value.toLocaleString()}
                          {m.unit ? (
                            <span className="text-[10px] text-stt-muted">
                              {' '}
                              {m.unit}
                            </span>
                          ) : null}
                        </div>
                        <Link
                          href={m.href}
                          className="text-[10px] font-semibold text-stt-blue hover:underline"
                        >
                          Source
                        </Link>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
              <div className="border-b border-stt-line px-4 py-3">
                <h3 className="text-[12.5px] font-bold">Framework reports</h3>
                <p className="mt-0.5 text-[11px] text-stt-muted">
                  Label readiness — full generators later
                </p>
              </div>
              <ul className="divide-y divide-stt-line">
                {FRAMEWORK_REPORTS.map((f) => (
                  <li
                    key={f.code}
                    className="flex items-center gap-2 px-4 py-2.5"
                  >
                    <Badge className="rounded-full bg-stt-navy/10 font-mono-stt text-stt-navy">
                      {f.code}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-stt-ink">
                        {f.name}
                      </div>
                      <div className="text-[10px] text-stt-muted">{f.note}</div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="h-7 rounded-[7px] text-[10px]"
                    >
                      <Link href="/reports">Reports</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2.5 text-[11px] leading-relaxed text-[#1E4FA8]">
          Score blends compliance health, published DPPs, verified facilities/TCs,
          and footprint fields. Scope 1/2/3 ledgers and SBTi targets ship later —
          use DPP carbon/water as the current measured layer.
        </p>
      </div>
    </PageWrapper>
  );
}

function clampProgress(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}
