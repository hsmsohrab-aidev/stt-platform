import type { SupabaseClient } from '@supabase/supabase-js';

/** Upsert current-month mass balance row from wallet ledger totals. */
export async function syncMassBalanceForMaterial(opts: {
  supabase: SupabaseClient;
  organizationId: string;
  walletId: string;
  materialId: string;
}) {
  const { supabase, organizationId, walletId, materialId } = opts;
  const start = new Date();
  start.setUTCDate(1);
  const periodStart = start.toISOString().slice(0, 10);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  const periodEnd = end.toISOString().slice(0, 10);

  const { data: txs } = await supabase
    .from('material_transactions')
    .select('transaction_type, quantity, reference_type')
    .eq('wallet_id', walletId)
    .eq('material_id', materialId);

  let totalReceived = 0;
  let totalIssued = 0;
  let totalConsumed = 0;

  for (const t of txs ?? []) {
    const q = Number(t.quantity);
    if (t.transaction_type === 'credit' || t.transaction_type === 'opening_balance') {
      totalReceived += q;
    } else if (t.transaction_type === 'debit') {
      if (t.reference_type === 'tc') totalIssued += q;
      else totalConsumed += q;
    }
  }

  const { data: existing } = await supabase
    .from('mass_balance_records')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('material_id', materialId)
    .eq('period_start', periodStart)
    .maybeSingle();

  const payload = {
    organization_id: organizationId,
    material_id: materialId,
    period_start: periodStart,
    period_end: periodEnd,
    opening_balance: 0,
    total_received: totalReceived,
    total_consumed: totalConsumed,
    total_issued: totalIssued,
    is_balanced: true,
  };

  if (existing?.id) {
    await supabase.from('mass_balance_records').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('mass_balance_records').insert(payload);
  }
}
