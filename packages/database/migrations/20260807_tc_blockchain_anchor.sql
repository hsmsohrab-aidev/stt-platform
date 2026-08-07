-- Phase 2.5 TC hash anchoring (mock ledger until Hyperledger Fabric)
-- Helpers: public.current_org_id() / public.is_platform_admin()
CREATE TABLE IF NOT EXISTS tc_blockchain_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tc_id           UUID NOT NULL REFERENCES transaction_certificates(id) ON DELETE CASCADE,
  network         TEXT NOT NULL DEFAULT 'stt_mock',
  channel         TEXT DEFAULT 'stt-local',
  chaincode       TEXT DEFAULT 'tc-hash-v1',
  tx_id           TEXT NOT NULL UNIQUE,
  block_number    BIGINT,
  document_hash   TEXT NOT NULL,
  payload         JSONB,
  anchored_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tc_blockchain_tc ON tc_blockchain_records(tc_id);
CREATE INDEX IF NOT EXISTS idx_tc_blockchain_hash ON tc_blockchain_records(document_hash);

ALTER TABLE tc_blockchain_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tc_blockchain_select ON tc_blockchain_records;
CREATE POLICY tc_blockchain_select ON tc_blockchain_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transaction_certificates tc
      WHERE tc.id = tc_blockchain_records.tc_id
        AND (
          tc.issuer_org_id = current_org_id()
          OR tc.receiver_org_id = current_org_id()
          OR tc.organization_id = current_org_id()
          OR is_platform_admin()
        )
    )
  );

DROP POLICY IF EXISTS tc_blockchain_insert ON tc_blockchain_records;
CREATE POLICY tc_blockchain_insert ON tc_blockchain_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM transaction_certificates tc
      WHERE tc.id = tc_blockchain_records.tc_id
        AND tc.issuer_org_id = current_org_id()
    )
  );
