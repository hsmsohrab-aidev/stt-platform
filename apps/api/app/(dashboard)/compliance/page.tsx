import Link from 'next/link';
import {
  BarChart,
  DonutChart,
  FilterBar,
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

const REGULATIONS = [
  {
    code: 'DPP',
    name: 'EU Digital Product Passport',
    href: '/dpp',
    focus: 'Product data · traceability · QR',
  },
  {
    code: 'CSRD',
    name: 'Corporate Sustainability Reporting',
    href: '/sustainability',
    focus: 'ESG disclosure · assurance',
  },
  {
    code: 'CSDDD',
    name: 'Corporate Sustainability Due Diligence',
    href: '/verification',
    focus: 'Value-chain due diligence',
  },
  {
    code: 'EUDR',
    name: 'EU Deforestation Regulation',
    href: '/supply-chain',
    focus: 'Origin · commodity risk',
  },
  {
    code: 'REACH',
    name: 'EU REACH Chemicals',
    href: '/materials',
    focus: 'Restricted substances',
  },
] as const;

export default async function CompliancePage() {
  const ctx = await requireSessionContext();
  const snapshot = await loadOrgRiskSnapshot(ctx.organizationId, ctx.orgType);
  const supabase = createClient();
  const tasks = snapshot.flags.filter((f) => f.category === 'compliance');

  const [{ data: certs }, { data: tcs }, { count: dppPublished }] = await Promise.all([
    supabase
      .from('facility_certifications')
      .select('id, cert_name, expiry_date, is_verified, facility_id, created_at')
      .order('expiry_date', { ascending: true })
      .limit(40),
    supabase
      .from('transaction_certificates')
      .select('id, tc_number, tc_status, issue_date, created_at')
      .or(
        `organization_id.eq.${ctx.organizationId},issuer_org_id.eq.${ctx.organizationId},receiver_org_id.eq.${ctx.organizationId}`
      )
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('product_passports')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'published'),
  ]);

  // Certs filtered to own facilities via RLS / join — also re-query by org facilities
  const { data: ownFacilities } = await supabase
    .from('facilities')
    .select('id, name')
    .eq('organization_id', ctx.organizationId);
  const facIds = new Set((ownFacilities ?? []).map((f) => f.id));
  const facName = new Map((ownFacilities ?? []).map((f) => [f.id, f.name]));
  const ownCerts = (certs ?? []).filter((c) => facIds.has(c.facility_id));

  const highTasks = tasks.filter(
    (t) => t.severity === 'critical' || t.severity === 'high'
  ).length;
  const upcomingDeadlines = ownCerts.filter((c) => {
    if (!c.expiry_date) return false;
    const days = Math.ceil(
      (new Date(c.expiry_date).getTime() - Date.now()) / 86400000
    );
    return days >= 0 && days <= 90;
  }).length;

  const attention = tasks.length + upcomingDeadlines;
  const severityData = countBy(tasks, (t) => t.severity);
  const kindData = countBy(tasks, (t) => t.kind.replace(/_/g, ' '));
  const trend = trendFromDates(
    [...tasks.map(() => new Date().toISOString()), ...(tcs ?? []).map((t) => t.created_at)],
    6
  );

  const regulationCards = REGULATIONS.map((r) => {
    let score = snapshot.complianceScore;
    let status: 'Ready' | 'Partial' | 'Gap' = 'Partial';
    if (r.code === 'DPP') {
      score = Math.min(100, (dppPublished ?? 0) * 12 + 40);
      status = (dppPublished ?? 0) > 0 ? 'Partial' : 'Gap';
      if ((dppPublished ?? 0) >= 5) status = 'Ready';
    } else if (r.code === 'REACH' || r.code === 'EUDR') {
      score = Math.max(35, snapshot.complianceScore - highTasks * 3);
      status = highTasks > 3 ? 'Gap' : highTasks > 0 ? 'Partial' : 'Ready';
    } else if (r.code === 'CSDDD') {
      const openVr = tasks.filter((t) => t.kind === 'open_verification').length;
      score = Math.max(30, 90 - openVr * 8);
      status = openVr > 2 ? 'Gap' : openVr > 0 ? 'Partial' : 'Ready';
    } else {
      status =
        snapshot.complianceScore >= 80
          ? 'Ready'
          : snapshot.complianceScore >= 55
            ? 'Partial'
            : 'Gap';
    }
    return { ...r, score: Math.round(clamp(score, 0, 100)), status };
  });

  const evidence = [
    ...ownCerts.slice(0, 8).map((c) => ({
      id: c.id,
      title: c.cert_name,
      meta: `${facName.get(c.facility_id) ?? 'Facility'} · exp ${c.expiry_date ?? '—'}`,
      href: '/facilities',
      kind: 'Certificate',
    })),
    ...(tcs ?? []).slice(0, 8).map((tc) => ({
      id: tc.id,
      title: tc.tc_number,
      meta: `${tc.tc_status} · ${tc.issue_date}`,
      href: `/tc/${tc.id}`,
      kind: 'TC',
    })),
  ];

  return (
    <PageWrapper
      title="Compliance Command Center"
      description={`${ctx.orgName} · centralize · automate · assure`}
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
      <FilterBar
        items={[
          { label: 'Frameworks', value: `${REGULATIONS.length} tracked` },
          { label: 'Window', value: 'Live ops' },
          { label: 'Score', value: `${snapshot.complianceScore}` },
        ]}
      />

      <StatBoxes
        items={[
          { label: 'Compliance %', value: snapshot.complianceScore, hint: '100 = clear' },
          { label: 'Open incidents', value: tasks.length },
          { label: 'Upcoming deadlines', value: upcomingDeadlines, hint: '≤90d certs' },
          { label: 'Require attention', value: attention },
        ]}
      />

      <div className="mb-3.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {regulationCards.map((r) => (
          <Link
            key={r.code}
            href={r.href}
            className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)] transition hover:border-stt-green/40"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge className="rounded-full bg-stt-navy/10 font-mono-stt text-stt-navy">
                {r.code}
              </Badge>
              <Badge
                className={
                  r.status === 'Ready'
                    ? 'rounded-full bg-stt-green-soft text-stt-green-dark'
                    : r.status === 'Gap'
                      ? 'rounded-full bg-stt-red-soft text-stt-red'
                      : 'rounded-full bg-stt-amber-soft text-stt-amber'
                }
              >
                {r.status}
              </Badge>
            </div>
            <div className="mt-2 font-display text-[22px] font-bold text-stt-ink">
              {r.score}%
            </div>
            <div className="mt-0.5 text-[11px] font-semibold text-stt-ink">{r.name}</div>
            <div className="mt-1 text-[10.5px] text-stt-muted">{r.focus}</div>
          </Link>
        ))}
      </div>

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-3">
        <DonutChart title="Tasks by severity" data={severityData} />
        <BarChart title="Tasks by type" data={kindData} />
        <TrendChart title="Compliance signal trend" data={trend} color="#2D6CDF" />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[13.5px] font-bold">Upcoming compliance tasks</h3>
            <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
              {tasks.length}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Severity</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Task</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Progress</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-[12px] text-stt-muted">
                    No open compliance tasks from TC, certs, or verification.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((t) => {
                  const progress =
                    t.severity === 'critical' ? 15 : t.severity === 'high' ? 35 : 55;
                  return (
                    <TableRow key={t.id} className="hover:bg-[#F7FAFC]">
                      <TableCell>
                        <Badge
                          className={`rounded-full capitalize ${severityBadge(t.severity)}`}
                        >
                          {t.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={t.href}
                          className="text-[12px] font-semibold text-stt-blue hover:underline"
                        >
                          {t.title}
                        </Link>
                        <div className="text-[11px] text-stt-muted">{t.description}</div>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#EDF1F6]">
                          <div
                            className="h-full rounded-full bg-stt-amber"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="font-mono-stt mt-1 text-[10px] text-stt-faint">
                          {progress}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={t.href}
                          className="text-[11px] font-semibold text-stt-blue hover:underline"
                        >
                          Resolve
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Evidence vault</h3>
              <p className="mt-0.5 text-[11px] text-stt-muted">
                Certs + TCs linked to compliance controls
              </p>
            </div>
            <ul className="divide-y divide-stt-line">
              {evidence.length === 0 ? (
                <li className="px-4 py-6 text-[12px] text-stt-muted">
                  No evidence files yet — declare facilities and receive TCs.
                </li>
              ) : (
                evidence.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-2 px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className="rounded-full bg-[#EDF1F6] text-[10px] text-stt-muted">
                          {e.kind}
                        </Badge>
                        <Link
                          href={e.href}
                          className="truncate text-[12px] font-semibold text-stt-blue hover:underline"
                        >
                          {e.title}
                        </Link>
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-stt-muted">{e.meta}</div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="border-b border-stt-line px-4 py-3">
              <h3 className="text-[13.5px] font-bold">Standards readiness</h3>
            </div>
            <ul className="divide-y divide-stt-line">
              {STANDARDS_READINESS.map((s) => (
                <li key={s.code} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full bg-stt-navy/10 font-mono-stt text-stt-navy">
                      {s.code}
                    </Badge>
                    <span className="text-[12px] font-semibold">{s.name}</span>
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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
