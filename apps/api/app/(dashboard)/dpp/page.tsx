import Link from 'next/link';
import { CreatePassportForm } from '@/app/(dashboard)/dpp/create-form';
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
    .limit(40);

  return (
    <PageWrapper
      title="Digital Product Passport"
      description="EU ESPR-ready · draft → publish → public QR"
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Passports</h3>
            <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
              {passports?.length ?? 0}
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
              {(passports ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No passports yet — create a draft on the right.
                  </TableCell>
                </TableRow>
              ) : (
                (passports ?? []).map((p) => (
                  <TableRow key={p.id}>
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
