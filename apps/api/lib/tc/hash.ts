import { createHash, randomBytes } from 'crypto';

export type TcAnchorLine = {
  material_id: string;
  quantity: number;
  unit: string;
  certification: string | null;
};

export type TcAnchorPayload = {
  tc_id: string;
  tc_number: string;
  issuer_org_id: string;
  receiver_org_id: string;
  issue_date: string;
  total_quantity: number;
  quantity_unit: string;
  lines: TcAnchorLine[];
};

/** Stable canonical JSON (sorted keys) for deterministic hashing. */
export function canonicalTcPayload(payload: TcAnchorPayload): string {
  const lines = [...payload.lines]
    .map((l) => ({
      certification: l.certification,
      material_id: l.material_id,
      quantity: Number(l.quantity),
      unit: l.unit,
    }))
    .sort((a, b) => a.material_id.localeCompare(b.material_id));

  const ordered = {
    issue_date: payload.issue_date,
    issuer_org_id: payload.issuer_org_id,
    lines,
    quantity_unit: payload.quantity_unit,
    receiver_org_id: payload.receiver_org_id,
    tc_id: payload.tc_id,
    tc_number: payload.tc_number,
    total_quantity: Number(payload.total_quantity),
  };

  return JSON.stringify(ordered);
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function hashTcPayload(payload: TcAnchorPayload): {
  documentHash: string;
  canonical: string;
} {
  const canonical = canonicalTcPayload(payload);
  return { documentHash: sha256Hex(canonical), canonical };
}

/** Mock ledger tx id until Hyperledger Fabric is wired. */
export function mockAnchorTxId(documentHash: string): string {
  const suffix = randomBytes(4).toString('hex');
  return `STT-ANCHOR-${documentHash.slice(0, 16)}-${suffix}`;
}
