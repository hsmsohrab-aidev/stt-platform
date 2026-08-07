import Link from 'next/link';
import { FacilityForm } from '@/app/(dashboard)/facilities/facility-form';
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

export default async function FacilitiesPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: facilities } = await supabase
    .from('facilities')
    .select(
      'id, name, facility_type, tier_level, city, country, is_verified, is_active, created_at'
    )
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });

  const rows = facilities ?? [];
  const typeData = countBy(rows, (f) => f.facility_type ?? '—').slice(0, 8);
  const tierData = countBy(rows, (f) =>
    f.tier_level != null ? `Tier ${f.tier_level}` : '—'
  );
  const verified = rows.filter((f) => f.is_verified).length;
  const active = rows.filter((f) => f.is_active).length;

  return (
    <PageWrapper
      title="Supply Chain Declaration"
      description="Declare facilities · tier 1→6 transparency"
    >
      <StatBoxes
        items={[
          { label: 'Total', value: rows.length },
          { label: 'Verified', value: verified },
          { label: 'Active', value: active },
          { label: 'Facility types', value: typeData.length },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <BarChart title="By facility type" data={typeData} />
        <DonutChart title="By tier" data={tierData} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Declared facilities</h3>
            <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark hover:bg-stt-green-soft">
              {rows.length} total
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase tracking-wide text-stt-faint">
                  Facility
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide text-stt-faint">
                  Process
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide text-stt-faint">
                  Tier
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide text-stt-faint">
                  Location
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide text-stt-faint">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[12px] text-stt-muted">
                    No facilities yet — declare your first unit.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((f) => (
                  <TableRow key={f.id} className="hover:bg-[#F7FAFC]">
                    <TableCell>
                      <Link
                        href={`/facilities/${f.id}`}
                        className="text-[12px] font-semibold text-stt-blue hover:underline"
                      >
                        {f.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[12px]">{f.facility_type}</TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {f.tier_level ?? '—'}
                    </TableCell>
                    <TableCell className="text-[12px] text-stt-muted">
                      {[f.city, f.country].filter(Boolean).join(', ') || '—'}
                    </TableCell>
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
            <h3 className="text-[12.5px] font-bold">＋ Declare facility</h3>
          </div>
          <div className="p-4">
            <FacilityForm />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
