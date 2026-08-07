import { CreditForm } from '@/app/(dashboard)/wallet/credit-form';
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

  const [balancesResult, txsResult] = wallet
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
          .limit(12),
      ])
    : [{ data: [] }, { data: [] }];

  const balances = balancesResult.data;
  const txs = txsResult.data;

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

      <div className="mb-3.5 grid gap-3 sm:grid-cols-3">
        {[
          ['Received (recent ledger)', creditTotal],
          ['Issued / debit (recent)', debitTotal],
          ['Available now', availableTotal],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
          >
            <div className="text-[10.5px] font-semibold text-stt-muted">{label}</div>
            <div className="mt-1 font-display text-[20px] font-bold text-stt-ink">
              {Number(value).toLocaleString()}{' '}
              <span className="text-[11px] text-stt-muted">KG</span>
            </div>
          </div>
        ))}
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
                    <TableRow key={t.id}>
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
    </PageWrapper>
  );
}
