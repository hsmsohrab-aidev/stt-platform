import { CreditForm } from '@/app/(dashboard)/wallet/credit-form';
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

const CHART_COLORS = [
  '#12A45B',
  '#2D6CDF',
  '#D98A1F',
  '#7A4FD0',
  '#D64545',
  '#0E2A47',
  '#5D7189',
  '#0B7A42',
];

function asMaterial(
  value: unknown
): { name: string; standard: string | null; material_type?: string } | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const first = value[0] as
      | { name: string; standard: string | null; material_type?: string }
      | undefined;
    return first ?? null;
  }
  return value as { name: string; standard: string | null; material_type?: string };
}

export default async function WalletPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const [{ data: materials }, { data: wallet }] = await Promise.all([
    supabase
      .from('materials')
      .select('id, name, standard')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('material_wallets')
      .select('id')
      .eq('organization_id', ctx.organizationId)
      .is('facility_id', null)
      .maybeSingle(),
  ]);

  const [balancesResult, txsResult, mbResult] = wallet
    ? await Promise.all([
        supabase
          .from('wallet_balances')
          .select(
            'id, balance_qty, reserved_qty, available_qty, unit, material_id, materials(name, standard, material_type)'
          )
          .eq('wallet_id', wallet.id)
          .order('last_updated_at', { ascending: false }),
        supabase
          .from('material_transactions')
          .select(
            'id, transaction_type, quantity, unit, description, transaction_date, materials(name)'
          )
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('mass_balance_records')
          .select(
            'id, period_start, period_end, opening_balance, total_received, total_consumed, total_issued, closing_balance, is_balanced, materials(name)'
          )
          .eq('organization_id', ctx.organizationId)
          .order('period_end', { ascending: false })
          .limit(25),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const balances = balancesResult.data;
  const txs = txsResult.data;
  const massBalances = mbResult.data;

  const creditTotal = (txs ?? [])
    .filter((t) => t.transaction_type === 'credit')
    .reduce((sum, t) => sum + Number(t.quantity), 0);
  const debitTotal = (txs ?? [])
    .filter((t) => t.transaction_type === 'debit')
    .reduce((sum, t) => sum + Number(t.quantity), 0);
  const availableTotal = (balances ?? []).reduce(
    (sum, b) => sum + Number(b.available_qty),
    0
  );
  const lowBalance = (balances ?? []).some((b) => Number(b.available_qty) < 100);

  const balanceBars = (balances ?? []).map((b, i) => {
    const mat = asMaterial(b.materials);
    return {
      label: mat?.name ?? 'Material',
      value: Number(b.available_qty),
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  const txTypeData = countBy(txs ?? [], (t) => t.transaction_type ?? '—');

  return (
    <PageWrapper
      title="Material Wallet"
      description="Mass-balance ready · every credit/debit ledgered"
    >
      {lowBalance ? (
        <div className="mb-3 rounded-[9px] border border-[#F2C7C7] bg-stt-red-soft px-3 py-2 text-[11.5px] text-[#A33]">
          Low balance warning: at least one material is under 100 KG available.
        </div>
      ) : null}

      <StatBoxes
        items={[
          { label: 'Received (recent ledger)', value: `${Number(creditTotal).toLocaleString()} KG` },
          { label: 'Issued / debit (recent)', value: `${Number(debitTotal).toLocaleString()} KG` },
          { label: 'Available now', value: `${Number(availableTotal).toLocaleString()} KG` },
          { label: 'Materials', value: (balances ?? []).length },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        {balanceBars.length > 0 ? (
          <BarChart title="Available by material" data={balanceBars} />
        ) : null}
        <DonutChart title="Transaction types" data={txTypeData} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(balances ?? []).length === 0 ? (
          <div className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)] sm:col-span-2">
            <div className="text-[10.5px] font-semibold text-stt-muted">Balances</div>
            <div className="mt-1 font-display text-[18px] font-bold">No materials yet</div>
            <p className="mt-1 text-[11px] text-stt-muted">
              Credit an opening balance to activate the wallet.
            </p>
          </div>
        ) : (
          (balances ?? []).map((b) => {
            const mat = asMaterial(b.materials);
            return (
              <div
                key={b.id}
                className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold text-stt-muted">
                    {mat?.name ?? 'Material'}
                  </span>
                  {mat?.standard ? (
                    <Badge className="rounded-full bg-stt-blue-soft text-stt-blue hover:bg-stt-blue-soft">
                      {mat.standard}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-1 font-display text-[21px] font-bold text-stt-ink">
                  {Number(b.available_qty).toLocaleString()}{' '}
                  <span className="text-[11px] text-stt-muted">{b.unit}</span>
                </div>
                <div className="mt-1 text-[10.5px] text-stt-muted">
                  Balance {Number(b.balance_qty).toLocaleString()} · Reserved{' '}
                  {Number(b.reserved_qty).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Recent transactions</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Date</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Type</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Material</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(txs ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-[12px] text-stt-muted">
                    No ledger entries yet.
                  </TableCell>
                </TableRow>
              ) : (
                (txs ?? []).map((t) => {
                  const mat = asMaterial(t.materials);
                  return (
                    <TableRow key={t.id} className="hover:bg-[#F7FAFC]">
                      <TableCell className="font-mono-stt text-[11px]">
                        {t.transaction_date}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                          {t.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[12px]">{mat?.name ?? '—'}</TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {Number(t.quantity).toLocaleString()} {t.unit}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Credit material</h3>
          </div>
          <div className="p-4">
            <CreditForm materials={materials ?? []} />
            <div className="mt-3 rounded-[9px] border border-[#F2C7C7] bg-stt-red-soft px-3 py-2 text-[11px] leading-relaxed text-[#A33]">
              Ledger integrity: debits that exceed available balance are rejected by
              the database trigger.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3.5 rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[12.5px] font-bold">Mass-balance periods</h3>
          <Badge className="ml-auto rounded-full bg-stt-green-soft text-stt-green-dark">
            {(massBalances ?? []).length}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase text-stt-faint">Material</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Period</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">In / Out</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Closing</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(massBalances ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-[12px] text-stt-muted">
                  No mass-balance periods yet — credit wallet or issue TCs to sync.
                </TableCell>
              </TableRow>
            ) : (
              (massBalances ?? []).map((row) => {
                const mat = asMaterial(row.materials);
                return (
                  <TableRow key={row.id} className="hover:bg-[#F7FAFC]">
                    <TableCell className="text-[12px] font-semibold">
                      {mat?.name ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {row.period_start} → {row.period_end}
                    </TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      +{Number(row.total_received ?? 0).toLocaleString()} / −
                      {Number(
                        (row.total_issued ?? 0) + (row.total_consumed ?? 0)
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {Number(row.closing_balance ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          row.is_balanced
                            ? 'rounded-full bg-stt-green-soft text-stt-green-dark'
                            : 'rounded-full bg-stt-amber-soft text-stt-amber'
                        }
                      >
                        {row.is_balanced ? 'Balanced' : 'Review'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
}
