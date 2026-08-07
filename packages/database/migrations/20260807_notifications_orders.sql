-- Migration: notifications + orders (applied via Supabase MCP 2026-08-07)
-- See remote: add_notifications_and_orders

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID REFERENCES organizations(id),
  user_id             UUID REFERENCES profiles(id),
  title               TEXT NOT NULL,
  body                TEXT,
  severity            alert_severity DEFAULT 'info',
  module              TEXT,
  entity_type         TEXT,
  entity_id           UUID,
  action_url          TEXT,
  is_read             BOOLEAN DEFAULT FALSE,
  read_at             TIMESTAMPTZ,
  channel             TEXT DEFAULT 'in_app',
  sent_at             TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  order_number        TEXT NOT NULL,
  po_number           TEXT,
  season              TEXT,
  buyer_org_id        UUID NOT NULL REFERENCES organizations(id),
  supplier_org_id     UUID REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),
  order_date          DATE DEFAULT CURRENT_DATE,
  required_ship_date  DATE,
  required_delivery_date DATE,
  total_quantity      INT,
  quantity_unit       TEXT DEFAULT 'pcs',
  total_value         DECIMAL(15,2),
  currency            TEXT DEFAULT 'USD',
  status              TEXT DEFAULT 'draft',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, order_number)
);

CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  style_number    TEXT,
  description     TEXT NOT NULL,
  color           TEXT,
  quantity        INT NOT NULL,
  unit_price      DECIMAL(10,2),
  total_price     DECIMAL(12,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
