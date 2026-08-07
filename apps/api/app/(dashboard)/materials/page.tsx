import Link from 'next/link';
import {
  BarChart,
  DonutChart,
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

export default async function MaterialsPage() {
  await requireSessionContext();
  const supabase = createClient();

  const { data: materials } = await supabase
    .from('materials')
    .select('id, name, material_type, standard, is_active')
    .eq('is_active', true)
    .order('name');

  const rows = materials ?? [];
  const byType = countBy(rows, (m) => m.material_type ?? '—');
  const byStandard = countBy(rows, (m) => m.standard ?? 'Uncertified');

  return (
    <PageWrapper
      title="Materials"
      description="Platform material master · used by wallet & TC"
    >
      <StatBoxes
        items={[
          { label: 'Active materials', value: rows.length },
          { label: 'Types', value: byType.length },
          { label: 'Standards', value: byStandard.length },
          {
            label: 'Certified',
            value: rows.filter((m) => m.standard).length,
          },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <DonutChart title="By material type" data={byType} />
        <BarChart title="By standard" data={byStandard} />
      </div>

      <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[12.5px] font-bold">Catalog</h3>
          <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
            {rows.length} active
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase text-stt-faint">Name</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Type</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Standard</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Use</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id} className="hover:bg-[#F7FAFC]">
                <TableCell className="text-[12px] font-semibold">{m.name}</TableCell>
                <TableCell className="font-mono-stt text-[11px]">
                  {m.material_type}
                </TableCell>
                <TableCell>
                  {m.standard ? (
                    <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
                      {m.standard}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href="/wallet"
                    className="text-[11px] font-semibold text-stt-blue hover:underline"
                  >
                    Wallet →
                  </Link>
                  {' · '}
                  <Link
                    href="/tc"
                    className="text-[11px] font-semibold text-stt-blue hover:underline"
                  >
                    TC →
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
}
