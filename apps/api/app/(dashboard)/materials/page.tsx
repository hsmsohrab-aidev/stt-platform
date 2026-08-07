import Link from 'next/link';
import {
  BarChart,
  DonutChart,
  FilterBar,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
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

const REG_MAP: Record<string, string[]> = {
  GOTS: ['DPP', 'CSRD', 'REACH'],
  GRS: ['DPP', 'CSRD', 'EUDR'],
  OCS: ['DPP', 'CSRD'],
  RCS: ['DPP', 'CSRD'],
  'OEKO-TEX': ['REACH', 'DPP'],
  REACH: ['REACH', 'CSDDD'],
  BCI: ['CSRD', 'CSDDD'],
};

function riskForMaterial(input: {
  standard: string | null;
  material_type: string | null;
  balance?: number;
}): { level: 'Low' | 'Medium' | 'High'; score: number } {
  let score = 72;
  if (input.standard) score += 14;
  else score -= 18;
  const type = (input.material_type ?? '').toLowerCase();
  if (type.includes('chem') || type.includes('dye')) {
    score -= 12;
  }
  if (input.balance != null && input.balance < 100) score -= 10;
  score = Math.max(20, Math.min(98, score));
  const level = score >= 75 ? 'Low' : score >= 55 ? 'Medium' : 'High';
  return { level, score };
}

export default async function MaterialsPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const [{ data: materials }, { data: wallet }] = await Promise.all([
    supabase
      .from('materials')
      .select('id, name, material_type, standard, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('material_wallets')
      .select('id')
      .eq('organization_id', ctx.organizationId)
      .is('facility_id', null)
      .maybeSingle(),
  ]);

  const { data: balances } = wallet
    ? await supabase
        .from('wallet_balances')
        .select('material_id, available_qty')
        .eq('wallet_id', wallet.id)
    : { data: [] };

  const balanceByMaterial = new Map(
    (balances ?? []).map((b) => [b.material_id, Number(b.available_qty ?? 0)])
  );

  const rows = (materials ?? []).map((m) => {
    const bal = balanceByMaterial.get(m.id);
    const risk = riskForMaterial({
      standard: m.standard,
      material_type: m.material_type,
      balance: bal,
    });
    const regs: string[] = m.standard
      ? (REG_MAP[m.standard] ?? ['DPP', 'CSRD'])
      : ['CSDDD'];
    return { ...m, risk, regs, balance: bal };
  });

  const highRisk = rows.filter((r) => r.risk.level === 'High').length;
  const verified = rows.filter((r) => Boolean(r.standard)).length;
  const byType = countBy(rows, (m) => m.material_type ?? '—');
  const byRisk = countBy(rows, (m) => m.risk.level, [
    '#12A45B',
    '#D98A1F',
    '#D64545',
  ]);
  const topRiskByCat = countBy(
    rows.filter((r) => r.risk.level !== 'Low'),
    (m) => m.material_type ?? 'Other'
  );

  return (
    <PageWrapper
      title="AI Material Intelligence"
      description="Identify · assess · verify materials across wallet & TC"
    >
      <FilterBar
        items={[
          { label: 'Catalog', value: `${rows.length} active` },
          { label: 'Wallet lines', value: String(balanceByMaterial.size) },
          { label: 'Org', value: ctx.orgName.slice(0, 22) },
        ]}
      />

      <StatBoxes
        items={[
          { label: 'Total materials', value: rows.length },
          { label: 'High risk', value: highRisk },
          {
            label: 'Verified / certified',
            value: verified,
            hint: `${rows.length ? Math.round((verified / rows.length) * 100) : 0}%`,
          },
          {
            label: 'Avg compliance score',
            value:
              rows.length === 0
                ? '—'
                : Math.round(
                    rows.reduce((s, r) => s + r.risk.score, 0) / rows.length
                  ),
            hint: '/100',
          },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-3">
        <DonutChart title="Material risk distribution" data={byRisk} />
        <BarChart title="Top material risk by category" data={topRiskByCat} />
        <DonutChart title="By material type" data={byType} />
      </div>

      <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[13.5px] font-bold">Material intelligence list</h3>
          <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
            {rows.length}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase text-stt-faint">Material</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Category</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Risk</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Score</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Regulations</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-[12px] text-stt-muted">
                  No active materials in catalog.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((m) => (
                <TableRow key={m.id} className="hover:bg-[#F7FAFC]">
                  <TableCell>
                    <div className="text-[12px] font-semibold text-stt-ink">{m.name}</div>
                    {m.standard ? (
                      <div className="text-[10px] text-stt-muted">{m.standard}</div>
                    ) : (
                      <div className="text-[10px] text-stt-amber">Uncertified</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono-stt text-[11px]">
                    {m.material_type}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        m.risk.level === 'High'
                          ? 'rounded-full bg-stt-red-soft text-stt-red'
                          : m.risk.level === 'Medium'
                            ? 'rounded-full bg-stt-amber-soft text-stt-amber'
                            : 'rounded-full bg-stt-green-soft text-stt-green-dark'
                      }
                    >
                      {m.risk.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono-stt text-[11px]">
                    {m.risk.score}/100
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.regs.map((r) => (
                        <Badge
                          key={r}
                          className="rounded-full bg-stt-navy/10 font-mono-stt text-[9px] text-stt-navy"
                        >
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px]">
                    <Link
                      href="/wallet"
                      className="font-semibold text-stt-blue hover:underline"
                    >
                      Wallet
                    </Link>
                    {' · '}
                    <Link
                      href="/tc"
                      className="font-semibold text-stt-blue hover:underline"
                    >
                      TC
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
}
