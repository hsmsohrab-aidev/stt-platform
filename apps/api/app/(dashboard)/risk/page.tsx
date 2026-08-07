import Link from 'next/link';
import {
  DonutChart,
  FilterBar,
  HeatMap,
  StatBoxes,
  TrendChart,
  countBy,
  trendFromDates,
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

const SEV_COLS = ['critical', 'high', 'medium', 'low'] as const;

export default async function RiskHubPage() {
  const ctx = await requireSessionContext();
  const snapshot = await loadOrgRiskSnapshot(ctx.organizationId, ctx.orgType);
  const supabase = createClient();

  const [{ data: notifications }, { count: facilityCount }, { count: supplierCount }] =
    await Promise.all([
      supabase
        .from('notifications')
        .select('id, created_at, severity')
        .eq('organization_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .limit(120),
      supabase
        .from('facilities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId),
      supabase
        .from('supplier_relationships')
        .select('id', { count: 'exact', head: true })
        .eq('brand_org_id', ctx.organizationId)
        .eq('status', 'active'),
    ]);

  const criticalCount = snapshot.flags.filter((f) => f.severity === 'critical').length;
  const monitored =
    (facilityCount ?? 0) +
    (supplierCount ?? 0) +
    snapshot.flags.length;

  const categories = Array.from(
    new Set(snapshot.flags.map((f) => f.category))
  );
  const heatRows = categories.length ? categories : ['risk', 'compliance'];
  const heatCells = heatRows.flatMap((row) =>
    SEV_COLS.map((col) => ({
      row,
      col,
      value: snapshot.flags.filter((f) => f.category === row && f.severity === col)
        .length,
      href: `/risk`,
    }))
  );

  const categoryData = countBy(snapshot.flags, (f) => f.category);
  const severityData = countBy(snapshot.flags, (f) => f.severity);
  const trend = trendFromDates(
    (notifications ?? []).map((n) => n.created_at),
    6
  );

  return (
    <PageWrapper
      title="Risk Hub"
      description={`${ctx.orgName} · identify · assess · monitor · mitigate`}
      actions={
        <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
          <Link href="/compliance">Compliance</Link>
        </Button>
      }
    >
      <FilterBar
        items={[
          { label: 'Locations', value: 'All' },
          { label: 'Categories', value: 'All' },
          { label: 'Window', value: 'Live derived' },
        ]}
      />

      <StatBoxes
        items={[
          { label: 'Critical alerts', value: criticalCount, hint: 'Act now' },
          { label: 'High risk items', value: snapshot.highCount },
          { label: 'At risk / open', value: snapshot.openFlagCount },
          { label: 'Monitored entities', value: monitored },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
        <HeatMap
          title="Risk heat map"
          rows={heatRows}
          cols={[...SEV_COLS]}
          cells={heatCells}
          className="xl:col-span-1"
        />
        <DonutChart title="Risk by category" data={categoryData} />
        <TrendChart title="Alert / signal trend (6 mo)" data={trend} color="#D64545" />
      </div>

      {severityData.length > 0 ? (
        <div className="mb-3.5">
          <DonutChart title="Flags by severity" data={severityData} />
        </div>
      ) : null}

      <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[13.5px] font-bold">Top risk alerts</h3>
          <Badge className="ml-auto rounded-full bg-stt-blue-soft text-stt-blue">
            {snapshot.openFlagCount}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase text-stt-faint">Severity</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Type</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Flag</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.flags.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
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
                  <TableCell className="font-mono-stt text-[11px] text-stt-muted">
                    {f.kind.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={f.href}
                      className="text-[12px] font-semibold text-stt-blue hover:underline"
                    >
                      {f.title}
                    </Link>
                    <div className="max-w-[320px] text-[11px] text-stt-muted">
                      {f.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="rounded-full bg-stt-amber-soft text-stt-amber">
                      Open
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={f.href}
                      className="text-[11px] font-semibold text-stt-blue hover:underline"
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

      <p className="mt-3.5 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2.5 text-[11px] leading-relaxed text-[#1E4FA8]">
        Risk score {snapshot.riskScore} · compliance score {snapshot.complianceScore}.
        Heat map and trends use live flags + notification history. Mitigation owners
        ship in Sprint 3.
      </p>
    </PageWrapper>
  );
}
