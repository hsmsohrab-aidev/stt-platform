import type { SupabaseClient } from '@supabase/supabase-js';
import {
  hashTcPayload,
  mockAnchorTxId,
  type TcAnchorLine,
  type TcAnchorPayload,
} from '@/lib/tc/hash';

export type AnchorTcInput = {
  supabase: SupabaseClient;
  tcId: string;
  tcNumber: string;
  issuerOrgId: string;
  receiverOrgId: string;
  issueDate: string;
  totalQuantity: number;
  quantityUnit: string;
  lines: TcAnchorLine[];
};

/**
 * SHA-256 hash + mock ledger record. Soft-fails so TC issue still succeeds
 * if anchoring table is unavailable.
 */
export async function anchorTcDocument(
  input: AnchorTcInput
): Promise<{ ok: true; hash: string; txId: string } | { ok: false; error: string }> {
  const payload: TcAnchorPayload = {
    tc_id: input.tcId,
    tc_number: input.tcNumber,
    issuer_org_id: input.issuerOrgId,
    receiver_org_id: input.receiverOrgId,
    issue_date: input.issueDate,
    total_quantity: input.totalQuantity,
    quantity_unit: input.quantityUnit,
    lines: input.lines,
  };

  const { documentHash, canonical } = hashTcPayload(payload);
  const txId = mockAnchorTxId(documentHash);
  const anchoredAt = new Date().toISOString();
  const blockNumber = Date.now() % 10_000_000;

  const { error: recordError } = await input.supabase
    .from('tc_blockchain_records')
    .insert({
      tc_id: input.tcId,
      network: 'stt_mock',
      channel: 'stt-local',
      chaincode: 'tc-hash-v1',
      tx_id: txId,
      block_number: blockNumber,
      document_hash: documentHash,
      payload: JSON.parse(canonical) as Record<string, unknown>,
      anchored_at: anchoredAt,
    });

  if (recordError) {
    return { ok: false, error: recordError.message };
  }

  const { error: tcError } = await input.supabase
    .from('transaction_certificates')
    .update({
      blockchain_hash: documentHash,
      blockchain_tx_id: txId,
      blockchain_anchored_at: anchoredAt,
      is_blockchain_anchored: true,
    })
    .eq('id', input.tcId);

  if (tcError) {
    return { ok: false, error: tcError.message };
  }

  return { ok: true, hash: documentHash, txId };
}

export async function verifyTcIntegrity(input: {
  supabase: SupabaseClient;
  tcId: string;
}): Promise<
  | { ok: true; match: boolean; storedHash: string | null; computedHash: string }
  | { ok: false; error: string }
> {
  const { data: tc } = await input.supabase
    .from('transaction_certificates')
    .select(
      'id, tc_number, issuer_org_id, receiver_org_id, issue_date, total_quantity, quantity_unit, blockchain_hash'
    )
    .eq('id', input.tcId)
    .maybeSingle();

  if (!tc) return { ok: false, error: 'TC not found.' };

  const { data: lines } = await input.supabase
    .from('tc_line_items')
    .select('material_id, quantity, unit, certification')
    .eq('tc_id', tc.id);

  const { documentHash } = hashTcPayload({
    tc_id: tc.id,
    tc_number: tc.tc_number,
    issuer_org_id: tc.issuer_org_id,
    receiver_org_id: tc.receiver_org_id,
    issue_date: tc.issue_date,
    total_quantity: Number(tc.total_quantity ?? 0),
    quantity_unit: tc.quantity_unit,
    lines: (lines ?? []).map((l) => ({
      material_id: l.material_id,
      quantity: Number(l.quantity),
      unit: l.unit,
      certification: l.certification ?? null,
    })),
  });

  return {
    ok: true,
    match: Boolean(tc.blockchain_hash) && tc.blockchain_hash === documentHash,
    storedHash: tc.blockchain_hash,
    computedHash: documentHash,
  };
}
