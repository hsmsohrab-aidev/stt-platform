import Link from 'next/link';
import { CreatePassportForm } from '@/app/(dashboard)/dpp/create-form';
import {
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

export default async function DppListPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: passports } = await supabase
    .from('product_passports')
    .select(
      'id, product_name, product_sku, product_category, status, published_at, created_at'
    )
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = passports ?? [];
  const statusData = countBy(rows, (p) => p.status ?? '—');
  const published = rows.filter((p) => p.status === 'published').length;
  const drafts = rows.filter((p) => p.status === 'draft').length;

  return (
    <PageWrapper
      title="Digital Product Passport"
      description="EU ESPR-ready · draft → publish · public QR"
    >
      <StatBoxes
        items={[
          { label: 'Total', value: rows.length },
          { label: 'Published', value: published },
          { label: 'Drafts', value: drafts },
          { label: 'Statuses', value: statusData.length },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <DonutChart title="By status" data={statusData} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Passports</h3>
            <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
              {rows.length}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Product</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">SKU</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No passports yet — create a draft on the right.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => (
                  <TableRow key={p.id} className="hover:bg-[#F7FAFC]">
                    <TableCell>
                      <Link
                        href={`/dpp/${p.id}`}
                        className="text-[12px] font-semibold text-stt-blue hover:underline"
                      >
                        {p.product_name}
                      </Link>
                      <div className="text-[10px] text-stt-muted">{p.product_category}</div>
                    </TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {p.product_sku ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          p.status === 'published'
                            ? 'rounded-full bg-stt-green-soft text-stt-green-dark'
                            : 'rounded-full bg-[#EDF1F6] text-stt-muted'
                        }
                      >
                        {p.status}
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
            <h3 className="text-[12.5px] font-bold">＋ New passport</h3>
          </div>
          <div className="p-4">
            <CreatePassportForm />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
