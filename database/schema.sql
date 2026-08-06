-- ============================================================
-- STT PLATFORM — COMPLETE DATABASE SCHEMA
-- Smart Traceability Technology
-- Database: Supabase (PostgreSQL)
-- Version: 1.0
-- Created: 2026-08-06
--
-- HOW TO APPLY:
-- Supabase Dashboard → SQL Editor → paste this file → Run
--
-- SECTIONS:
--   A. Extensions & Setup
--   B. Organizations & Users (10 tables)
--   C. Supply Chain Mapping (8 tables)
--   D. Order Management (8 tables)
--   E. Material Wallet & Mass Balance (7 tables)
--   F. Transaction Certificates (6 tables)
--   G. Digital Product Passport (6 tables)
--   H. Compliance & Regulations (8 tables)
--   I. Risk Hub (6 tables)
--   J. Sustainability & ESG (8 tables)
--   K. Verification Marketplace (5 tables)
--   L. Notifications & Alerts (3 tables)
--   M. Row Level Security (RLS) Policies
--   N. Indexes
--   O. Helper Functions & Triggers
-- ============================================================


-- ============================================================
-- A. EXTENSIONS & SETUP
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- full-text search

-- Custom ENUM types
CREATE TYPE org_type AS ENUM (
  'brand', 'supplier', 'auditor', 'logistics',
  'regulator', 'financial', 'platform_admin'
);

CREATE TYPE facility_type AS ENUM (
  'raw_material_source', 'spinning_mill', 'knitting_unit',
  'weaving_unit', 'dyeing_unit', 'printing_unit',
  'fabric_supplier', 'garment_factory', 'washing_unit',
  'finishing_unit', 'packing_logistics', 'warehouse'
);

CREATE TYPE tier_level AS ENUM (
  'tier_1', 'tier_2', 'tier_3', 'tier_4', 'tier_5', 'tier_6'
);

CREATE TYPE material_type AS ENUM (
  'cotton', 'polyester', 'recycled_cotton', 'recycled_polyester',
  'viscose', 'elastane', 'nylon', 'wool', 'linen',
  'silk', 'leather', 'rubber', 'eva', 'other'
);

CREATE TYPE tc_status AS ENUM (
  'draft', 'issued', 'transferred', 'verified', 'rejected', 'expired'
);

CREATE TYPE verification_status AS ENUM (
  'pending', 'in_progress', 'completed', 'failed', 'cancelled'
);

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE compliance_status AS ENUM (
  'compliant', 'partial', 'non_compliant', 'not_assessed', 'in_progress'
);

CREATE TYPE alert_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');

CREATE TYPE subscription_plan AS ENUM (
  'view_access', 'facility_membership',
  'importer_supply_chain', 'buyer_brand', 'enterprise'
);


-- ============================================================
-- B. ORGANIZATIONS & USERS
-- ============================================================

-- B1. organizations
-- Every company on the platform (brand, supplier, auditor, etc.)
CREATE TABLE organizations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,           -- URL-safe name: "hm-group"
  org_type            org_type NOT NULL,
  subscription_plan   subscription_plan DEFAULT 'view_access',
  subscription_status TEXT DEFAULT 'active',         -- active | expired | suspended
  subscription_ends_at TIMESTAMPTZ,

  -- Contact
  email               TEXT,
  phone               TEXT,
  website             TEXT,

  -- Address
  address_line1       TEXT,
  address_line2       TEXT,
  city                TEXT,
  state               TEXT,
  country             TEXT NOT NULL DEFAULT 'BD',
  postal_code         TEXT,

  -- Business info
  registration_number TEXT,
  tax_id              TEXT,
  founded_year        INT,
  employee_count      INT,

  -- Branding
  logo_url            TEXT,
  primary_color       TEXT DEFAULT '#0A1628',

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step     INT DEFAULT 1,

  -- Integration fee
  integration_fee_paid BOOLEAN DEFAULT FALSE,
  integration_fee_paid_at TIMESTAMPTZ,

  -- Meta
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- B2. profiles
-- Extends Supabase auth.users with extra info
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id     UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name           TEXT NOT NULL,
  avatar_url          TEXT,
  phone               TEXT,
  job_title           TEXT,
  department          TEXT,
  preferred_language  TEXT DEFAULT 'en',
  timezone            TEXT DEFAULT 'Asia/Dhaka',
  is_active           BOOLEAN DEFAULT TRUE,
  last_seen_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- B3. roles
-- System roles for RBAC
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT UNIQUE NOT NULL,   -- 'brand_admin', 'supplier_user', etc.
  description TEXT,
  org_type    org_type,              -- which org type this role belongs to
  is_system   BOOLEAN DEFAULT TRUE,  -- system roles vs custom
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default roles
INSERT INTO roles (name, description, org_type) VALUES
  ('platform_admin',      'Full platform access',                      NULL),
  ('brand_admin',         'Brand admin — full brand dashboard',         'brand'),
  ('brand_viewer',        'Brand read-only access',                     'brand'),
  ('brand_sourcing',      'Brand sourcing team',                        'brand'),
  ('supplier_admin',      'Supplier admin — full supplier dashboard',   'supplier'),
  ('supplier_operator',   'Supplier daily operations',                  'supplier'),
  ('auditor_lead',        'Lead auditor with full access',              'auditor'),
  ('auditor_field',       'Field auditor — assigned jobs only',         'auditor'),
  ('logistics_operator',  'Logistics update access',                    'logistics'),
  ('regulator_viewer',    'Regulator read-only access',                 'regulator'),
  ('financial_analyst',   'Financial institution analyst',              'financial');

-- B4. permissions
CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT UNIQUE NOT NULL,  -- 'tc.create', 'supply_chain.view', etc.
  description TEXT,
  module      TEXT NOT NULL,         -- 'tc', 'supply_chain', 'compliance', etc.
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- B5. role_permissions
CREATE TABLE role_permissions (
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- B6. organization_members
-- User ↔ Organization membership with role
CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id         UUID REFERENCES roles(id),
  is_owner        BOOLEAN DEFAULT FALSE,
  invited_by      UUID REFERENCES profiles(id),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- B7. invitations
-- Pending invites to join an organization
CREATE TABLE invitations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role_id         UUID REFERENCES roles(id),
  token           TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by      UUID REFERENCES profiles(id),
  accepted_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- B8. api_keys
-- Organization API keys for external integrations
CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,          -- "SAP Integration Key"
  key_hash        TEXT NOT NULL UNIQUE,   -- hashed key, never store plain
  key_prefix      TEXT NOT NULL,          -- first 8 chars for display: "sk_live_"
  scopes          TEXT[] DEFAULT '{}',    -- ['tc.read', 'order.write']
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- B9. audit_logs
-- Every important action logged immutably
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id         UUID REFERENCES profiles(id),
  action          TEXT NOT NULL,          -- 'tc.created', 'facility.updated'
  entity_type     TEXT,                   -- 'transaction_certificate'
  entity_id       UUID,                   -- the record that changed
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- B10. sessions
-- Active session tracking (supplement to Supabase auth)
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  device_info     JSONB,
  ip_address      INET,
  last_active_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '8 hours'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- C. SUPPLY CHAIN MAPPING
-- ============================================================

-- C1. facilities
-- Physical locations: factories, mills, units
CREATE TABLE facilities (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  facility_type       facility_type NOT NULL,
  tier_level          tier_level,
  facility_code       TEXT,               -- internal code

  -- Location
  address_line1       TEXT,
  city                TEXT,
  state               TEXT,
  country             TEXT NOT NULL DEFAULT 'BD',
  postal_code         TEXT,
  latitude            DECIMAL(10, 8),
  longitude           DECIMAL(11, 8),

  -- Contact
  contact_name        TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,

  -- Business
  registration_number TEXT,
  employee_count      INT,
  production_capacity TEXT,             -- "50,000 pcs/month"
  certifications      TEXT[],           -- ['GOTS', 'OCS', 'ISO9001']

  -- Status
  is_active           BOOLEAN DEFAULT TRUE,
  is_verified         BOOLEAN DEFAULT FALSE,
  verified_at         TIMESTAMPTZ,
  verified_by         UUID REFERENCES profiles(id),

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- C2. facility_declarations
-- Mandatory declaration: who works with whom
CREATE TABLE facility_declarations (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  declaring_org_id     UUID NOT NULL REFERENCES organizations(id),
  declaring_facility_id UUID NOT NULL REFERENCES facilities(id),
  declared_facility_id  UUID NOT NULL REFERENCES facilities(id),
  relationship_type     TEXT NOT NULL,  -- 'upstream_supplier' | 'downstream_customer'
  material_types        material_type[],
  declared_at           TIMESTAMPTZ DEFAULT NOW(),
  declared_by           UUID REFERENCES profiles(id),
  is_active             BOOLEAN DEFAULT TRUE,
  notes                 TEXT
);

-- C3. supplier_relationships
-- Brand ↔ Supplier formal relationship
CREATE TABLE supplier_relationships (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_org_id        UUID NOT NULL REFERENCES organizations(id),
  supplier_org_id     UUID NOT NULL REFERENCES organizations(id),
  tier_level          tier_level NOT NULL DEFAULT 'tier_1',
  status              TEXT DEFAULT 'active',   -- active | suspended | terminated
  onboarded_at        TIMESTAMPTZ DEFAULT NOW(),
  contract_start_date DATE,
  contract_end_date   DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_org_id, supplier_org_id)
);

-- C4. supply_chain_tiers
-- Full tier map per brand per supplier
CREATE TABLE supply_chain_tiers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_org_id        UUID NOT NULL REFERENCES organizations(id),
  supplier_org_id     UUID NOT NULL REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),
  tier_level          tier_level NOT NULL,
  parent_supplier_id  UUID REFERENCES organizations(id),  -- who this supplier works for
  material_types      material_type[],
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- C5. subcontractors
-- Declared subcontractors (must be transparent)
CREATE TABLE subcontractors (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id        UUID NOT NULL REFERENCES organizations(id),
  facility_id            UUID REFERENCES facilities(id),
  subcontractor_org_id   UUID REFERENCES organizations(id),
  subcontractor_name     TEXT,              -- if not on platform
  subcontractor_country  TEXT,
  work_type              TEXT,              -- "embroidery", "washing"
  is_declared            BOOLEAN DEFAULT TRUE,
  is_authorized          BOOLEAN DEFAULT TRUE,
  declared_at            TIMESTAMPTZ DEFAULT NOW(),
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- C6. facility_certifications
-- ISO, GOTS, OCS, BCI, etc.
CREATE TABLE facility_certifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id     UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  cert_name       TEXT NOT NULL,       -- 'GOTS', 'OCS', 'ISO9001'
  cert_number     TEXT,
  issuing_body    TEXT,
  issued_date     DATE,
  expiry_date     DATE,
  document_url    TEXT,                -- Supabase Storage URL
  is_verified     BOOLEAN DEFAULT FALSE,
  verified_by     UUID REFERENCES profiles(id),
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- C7. supply_chain_maps
-- Snapshot of full chain at a point in time
CREATE TABLE supply_chain_maps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_org_id    UUID NOT NULL REFERENCES organizations(id),
  snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  map_data        JSONB NOT NULL,    -- full tree as JSON
  total_tiers     INT,
  total_suppliers INT,
  coverage_pct    DECIMAL(5,2),     -- % of chain mapped
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- C8. unauthorized_flags
-- AI-detected anomalies in supply chain
CREATE TABLE unauthorized_flags (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),
  flag_type           TEXT NOT NULL,      -- 'unauthorized_subcontracting', 'undeclared_facility'
  description         TEXT,
  detected_by         TEXT DEFAULT 'ai', -- 'ai' | 'auditor' | 'system'
  confidence_score    DECIMAL(4,3),       -- 0.000 to 1.000
  status              TEXT DEFAULT 'open',  -- open | resolved | false_positive
  resolved_at         TIMESTAMPTZ,
  resolved_by         UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- D. ORDER MANAGEMENT
-- ============================================================

-- D1. orders
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),  -- brand
  order_number        TEXT NOT NULL,
  po_number           TEXT,                    -- Purchase Order number
  season              TEXT,                    -- 'SS2025', 'AW2025'

  -- Parties
  buyer_org_id        UUID NOT NULL REFERENCES organizations(id),
  supplier_org_id     UUID REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),

  -- Dates
  order_date          DATE,
  required_ship_date  DATE,
  required_delivery_date DATE,
  actual_ship_date    DATE,
  actual_delivery_date DATE,

  -- Details
  total_quantity      INT,
  quantity_unit       TEXT DEFAULT 'pcs',
  total_value         DECIMAL(15,2),
  currency            TEXT DEFAULT 'USD',
  incoterms           TEXT,                    -- 'FOB', 'CIF', etc.

  -- Status
  status              TEXT DEFAULT 'draft',    -- draft|confirmed|in_production|shipped|delivered|cancelled
  on_time_status      TEXT,                    -- on_time | at_risk | delayed
  completion_pct      DECIMAL(5,2) DEFAULT 0,

  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- D2. order_items
CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  style_number    TEXT,
  description     TEXT NOT NULL,
  color           TEXT,
  size_breakdown  JSONB,    -- {"S": 100, "M": 200, "L": 150}
  quantity        INT NOT NULL,
  unit_price      DECIMAL(10,2),
  total_price     DECIMAL(12,2),

  -- Material composition
  material_composition JSONB,  -- [{"material": "cotton", "pct": 60}, {"material": "polyester", "pct": 40}]
  gsm             DECIMAL(6,2),     -- grams per square meter

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- D3. order_milestones
CREATE TABLE order_milestones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  milestone_name  TEXT NOT NULL,   -- 'Fabric Sourced', 'Production Start', 'QC Passed'
  planned_date    DATE,
  actual_date     DATE,
  status          TEXT DEFAULT 'pending',   -- pending | completed | delayed | skipped
  notes           TEXT,
  completed_by    UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- D4. order_allocations
-- Order split across multiple factories
CREATE TABLE order_allocations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  facility_id     UUID NOT NULL REFERENCES facilities(id),
  allocated_qty   INT NOT NULL,
  allocation_pct  DECIMAL(5,2),
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- D5. shipments
CREATE TABLE shipments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  order_id            UUID REFERENCES orders(id),
  shipment_number     TEXT NOT NULL,
  bl_number           TEXT,          -- Bill of Lading number
  container_number    TEXT,

  -- Parties
  shipper_org_id      UUID REFERENCES organizations(id),
  consignee_org_id    UUID REFERENCES organizations(id),
  logistics_org_id    UUID REFERENCES organizations(id),

  -- Route
  origin_facility_id  UUID REFERENCES facilities(id),
  origin_port         TEXT,
  destination_port    TEXT,
  destination_address TEXT,
  country_of_origin   TEXT,

  -- Dates
  etd                 TIMESTAMPTZ,   -- estimated time of departure
  eta                 TIMESTAMPTZ,   -- estimated time of arrival
  actual_departure    TIMESTAMPTZ,
  actual_arrival      TIMESTAMPTZ,

  -- Cargo
  total_cartons       INT,
  total_weight_kg     DECIMAL(10,2),
  total_cbm           DECIMAL(8,3),  -- cubic meters

  -- Status
  status              TEXT DEFAULT 'pending',  -- pending|in_transit|customs|delivered|exception
  current_location    TEXT,
  current_latitude    DECIMAL(10,8),
  current_longitude   DECIMAL(11,8),

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- D6. shipment_events
-- Real-time movement tracking events
CREATE TABLE shipment_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id     UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,     -- 'departed', 'arrived_port', 'customs_cleared', 'delivered'
  event_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location        TEXT,
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  description     TEXT,
  source          TEXT DEFAULT 'manual',   -- 'manual' | 'gps' | 'api' | 'iot'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- D7. exceptions
-- Delays, deviations, alerts on orders/shipments
CREATE TABLE exceptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  order_id            UUID REFERENCES orders(id),
  shipment_id         UUID REFERENCES shipments(id),
  exception_type      TEXT NOT NULL,    -- 'delay', 'quality_issue', 'capacity_problem', 'compliance'
  severity            risk_level DEFAULT 'medium',
  title               TEXT NOT NULL,
  description         TEXT,
  impact_days         INT,              -- days of delay
  status              TEXT DEFAULT 'open',  -- open | in_progress | resolved
  assigned_to         UUID REFERENCES profiles(id),
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- D8. logistics_documents
CREATE TABLE logistics_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id     UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL,    -- 'bill_of_lading', 'packing_list', 'invoice', 'certificate_of_origin'
  doc_name        TEXT NOT NULL,
  file_url        TEXT NOT NULL,    -- Supabase Storage URL
  uploaded_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- E. MATERIAL WALLET & MASS BALANCE
-- ============================================================

-- E1. materials
-- Master list of materials
CREATE TABLE materials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  material_type   material_type NOT NULL,
  description     TEXT,
  unit            TEXT DEFAULT 'KG',         -- KG | MT | YDS | MTR
  standard        TEXT,                       -- 'GOTS', 'OCS', 'RCS', 'GRS'
  is_certified    BOOLEAN DEFAULT FALSE,
  is_recycled     BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common materials
INSERT INTO materials (name, material_type, unit, standard, is_certified) VALUES
  ('Organic Cotton',          'cotton',             'KG', 'GOTS', TRUE),
  ('Conventional Cotton',     'cotton',             'KG', NULL,   FALSE),
  ('BCI Cotton',              'cotton',             'KG', 'BCI',  TRUE),
  ('Recycled Polyester',      'recycled_polyester', 'KG', 'GRS',  TRUE),
  ('Virgin Polyester',        'polyester',          'KG', NULL,   FALSE),
  ('Recycled Cotton',         'recycled_cotton',    'KG', 'RCS',  TRUE),
  ('Viscose/Rayon',           'viscose',            'KG', NULL,   FALSE),
  ('Elastane/Spandex',        'elastane',           'KG', NULL,   FALSE),
  ('Nylon/Polyamide',         'nylon',              'KG', NULL,   FALSE),
  ('Merino Wool',             'wool',               'KG', NULL,   FALSE),
  ('Leather (Bovine)',        'leather',            'KG', NULL,   FALSE),
  ('Natural Rubber',          'rubber',             'KG', NULL,   FALSE),
  ('EVA (Ethylene Vinyl)',    'eva',                'KG', NULL,   FALSE);

-- E2. material_wallets
-- One wallet per organization
CREATE TABLE material_wallets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id     UUID REFERENCES facilities(id),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, facility_id)
);

-- E3. wallet_balances
-- Current balance per material per wallet
CREATE TABLE wallet_balances (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id       UUID NOT NULL REFERENCES material_wallets(id) ON DELETE CASCADE,
  material_id     UUID NOT NULL REFERENCES materials(id),
  balance_qty     DECIMAL(14,3) DEFAULT 0,
  reserved_qty    DECIMAL(14,3) DEFAULT 0,    -- allocated to pending orders
  available_qty   DECIMAL(14,3) GENERATED ALWAYS AS (balance_qty - reserved_qty) STORED,
  unit            TEXT DEFAULT 'KG',
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, material_id)
);

-- E4. material_transactions
-- Every debit/credit to wallet
CREATE TABLE material_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id           UUID NOT NULL REFERENCES material_wallets(id),
  material_id         UUID NOT NULL REFERENCES materials(id),
  transaction_type    TEXT NOT NULL,    -- 'credit' | 'debit' | 'adjustment' | 'reservation'
  quantity            DECIMAL(14,3) NOT NULL,
  unit                TEXT DEFAULT 'KG',
  reference_type      TEXT,            -- 'tc', 'order', 'adjustment', 'opening_balance'
  reference_id        UUID,            -- ID of the TC or order
  transaction_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  description         TEXT,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- E5. mass_balance_records
-- Mass balance calculation per period
CREATE TABLE mass_balance_records (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),
  material_id         UUID NOT NULL REFERENCES materials(id),
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  opening_balance     DECIMAL(14,3) DEFAULT 0,
  total_received      DECIMAL(14,3) DEFAULT 0,
  total_consumed      DECIMAL(14,3) DEFAULT 0,
  total_issued        DECIMAL(14,3) DEFAULT 0,  -- issued via TC
  closing_balance     DECIMAL(14,3) GENERATED ALWAYS AS
                      (opening_balance + total_received - total_consumed - total_issued) STORED,
  conversion_rate     DECIMAL(6,4) DEFAULT 1.0, -- input to output ratio
  is_balanced         BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- E6. material_requirements
-- AI-calculated material needed per order
CREATE TABLE material_requirements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  material_id         UUID NOT NULL REFERENCES materials(id),
  required_qty        DECIMAL(14,3) NOT NULL,
  unit                TEXT DEFAULT 'KG',
  calculation_method  TEXT DEFAULT 'ai',   -- 'ai' | 'manual'
  formula_used        JSONB,               -- calculation inputs/outputs
  is_available        BOOLEAN,             -- can wallet cover this?
  gap_qty             DECIMAL(14,3),       -- shortfall amount
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- E7. material_gaps
-- Alert when wallet can't cover order demand
CREATE TABLE material_gaps (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  order_id            UUID REFERENCES orders(id),
  material_id         UUID NOT NULL REFERENCES materials(id),
  required_qty        DECIMAL(14,3),
  available_qty       DECIMAL(14,3),
  gap_qty             DECIMAL(14,3),
  severity            risk_level DEFAULT 'medium',
  status              TEXT DEFAULT 'open',   -- open | resolved
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- F. TRANSACTION CERTIFICATES
-- ============================================================

-- F1. transaction_certificates
CREATE TABLE transaction_certificates (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  tc_number           TEXT UNIQUE NOT NULL,   -- 'TC-2024-00001'
  tc_status           tc_status DEFAULT 'draft',

  -- Parties
  issuer_org_id       UUID NOT NULL REFERENCES organizations(id),
  issuer_facility_id  UUID REFERENCES facilities(id),
  receiver_org_id     UUID NOT NULL REFERENCES organizations(id),
  receiver_facility_id UUID REFERENCES facilities(id),

  -- Linked documents
  order_id            UUID REFERENCES orders(id),
  shipment_id         UUID REFERENCES shipments(id),
  invoice_number      TEXT,

  -- Dates
  issue_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  shipment_date       DATE,
  expiry_date         DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),

  -- Summary
  total_quantity      DECIMAL(14,3),
  quantity_unit       TEXT DEFAULT 'KG',
  net_weight_kg       DECIMAL(14,3),
  gross_weight_kg     DECIMAL(14,3),

  -- Blockchain
  blockchain_tx_id    TEXT,               -- Hyperledger Fabric TX ID
  blockchain_hash     TEXT,               -- document hash
  blockchain_anchored_at TIMESTAMPTZ,
  is_blockchain_anchored BOOLEAN DEFAULT FALSE,

  -- Files
  pdf_url             TEXT,               -- generated TC PDF
  qr_code_url         TEXT,               -- QR code image

  -- Verification
  verified_by         UUID REFERENCES profiles(id),
  verified_at         TIMESTAMPTZ,
  rejection_reason    TEXT,

  notes               TEXT,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate TC number
CREATE SEQUENCE tc_number_seq START 1;
CREATE OR REPLACE FUNCTION generate_tc_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tc_number := 'TC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('tc_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tc_number
BEFORE INSERT ON transaction_certificates
FOR EACH ROW
WHEN (NEW.tc_number IS NULL OR NEW.tc_number = '')
EXECUTE FUNCTION generate_tc_number();

-- F2. tc_line_items
-- Materials in each TC
CREATE TABLE tc_line_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tc_id           UUID NOT NULL REFERENCES transaction_certificates(id) ON DELETE CASCADE,
  material_id     UUID NOT NULL REFERENCES materials(id),
  product_description TEXT,
  quantity        DECIMAL(14,3) NOT NULL,
  unit            TEXT DEFAULT 'KG',
  certification   TEXT,       -- 'GOTS', 'OCS', 'GRS'
  cert_percentage DECIMAL(5,2),  -- % of certified content
  lot_number      TEXT,
  hs_code         TEXT,          -- Harmonized System code for customs
  country_of_origin TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- F3. tc_verifications
-- Verification history of TCs
CREATE TABLE tc_verifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tc_id               UUID NOT NULL REFERENCES transaction_certificates(id),
  verification_status verification_status DEFAULT 'pending',
  verified_by         UUID REFERENCES profiles(id),
  verifier_org_id     UUID REFERENCES organizations(id),
  method              TEXT DEFAULT 'platform',   -- 'platform' | 'qr_scan' | 'api'
  notes               TEXT,
  verified_at         TIMESTAMPTZ DEFAULT NOW()
);

-- F4. tc_blockchain_records
CREATE TABLE tc_blockchain_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tc_id           UUID NOT NULL REFERENCES transaction_certificates(id),
  network         TEXT DEFAULT 'hyperledger_fabric',
  channel         TEXT DEFAULT 'stt-channel',
  chaincode       TEXT DEFAULT 'tc-chaincode',
  tx_id           TEXT NOT NULL UNIQUE,
  block_number    BIGINT,
  document_hash   TEXT NOT NULL,      -- SHA-256 of TC data
  payload         JSONB,              -- what was written to chain
  anchored_at     TIMESTAMPTZ DEFAULT NOW()
);

-- F5. tc_documents
-- Supporting documents for each TC
CREATE TABLE tc_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tc_id           UUID NOT NULL REFERENCES transaction_certificates(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL,   -- 'invoice', 'packing_list', 'test_report', 'cert_copy'
  doc_name        TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size_bytes INT,
  uploaded_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- F6. tc_transfers
-- TC ownership transfer history
CREATE TABLE tc_transfers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tc_id               UUID NOT NULL REFERENCES transaction_certificates(id),
  from_org_id         UUID NOT NULL REFERENCES organizations(id),
  to_org_id           UUID NOT NULL REFERENCES organizations(id),
  transfer_quantity   DECIMAL(14,3),
  transferred_at      TIMESTAMPTZ DEFAULT NOW(),
  transferred_by      UUID REFERENCES profiles(id),
  notes               TEXT
);


-- ============================================================
-- G. DIGITAL PRODUCT PASSPORT
-- ============================================================

-- G1. product_passports
CREATE TABLE product_passports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),

  -- Product info
  product_name        TEXT NOT NULL,
  product_sku         TEXT,
  product_category    TEXT,            -- 'apparel', 'footwear', 'home_textile'
  season              TEXT,
  gtin                TEXT,            -- Global Trade Item Number (barcode)
  batch_number        TEXT,

  -- EU DPP fields (Regulation 2024/1781)
  dpp_regulation      TEXT DEFAULT 'EU_2024_1781',
  material_composition JSONB,         -- [{"material": "cotton", "pct": 60, "certified": true}]
  country_of_origin   TEXT,
  manufacturing_facility_id UUID REFERENCES facilities(id),

  -- Sustainability
  carbon_footprint_kg DECIMAL(10,3),
  water_usage_liters  DECIMAL(10,3),
  recyclability_info  TEXT,
  end_of_life_instructions TEXT,
  repairability_score INT,             -- 1-10

  -- Care & Chemical
  care_instructions   JSONB,           -- washing, drying, ironing symbols
  chemical_compliance JSONB,           -- REACH, restricted substances

  -- Status
  status              TEXT DEFAULT 'draft',  -- draft | published | archived
  published_at        TIMESTAMPTZ,

  -- QR
  qr_code_url         TEXT,
  public_url          TEXT,            -- consumer-facing URL

  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- G2. passport_materials
-- Material journey per passport
CREATE TABLE passport_materials (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_id         UUID NOT NULL REFERENCES product_passports(id) ON DELETE CASCADE,
  material_id         UUID NOT NULL REFERENCES materials(id),
  tc_id               UUID REFERENCES transaction_certificates(id),
  percentage          DECIMAL(5,2),
  origin_country      TEXT,
  origin_facility_id  UUID REFERENCES facilities(id),
  certification       TEXT,
  is_verified         BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- G3. passport_supply_chain
-- Supply chain snapshot embedded in passport
CREATE TABLE passport_supply_chain (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_id         UUID NOT NULL REFERENCES product_passports(id) ON DELETE CASCADE,
  facility_id         UUID REFERENCES facilities(id),
  tier_level          tier_level,
  process_type        TEXT,            -- 'spinning', 'weaving', 'dyeing', 'sewing'
  country             TEXT,
  display_name        TEXT,            -- public-facing name (can be anonymized)
  is_visible_to_public BOOLEAN DEFAULT TRUE,
  sequence_order      INT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- G4. passport_sustainability
CREATE TABLE passport_sustainability (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_id         UUID NOT NULL REFERENCES product_passports(id) ON DELETE CASCADE,
  metric_name         TEXT NOT NULL,    -- 'carbon_footprint', 'water_usage', 'renewable_energy_pct'
  metric_value        DECIMAL(14,4),
  metric_unit         TEXT,
  verification_source TEXT,
  is_verified         BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- G5. passport_qr_codes
CREATE TABLE passport_qr_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_id     UUID NOT NULL REFERENCES product_passports(id) ON DELETE CASCADE,
  qr_type         TEXT DEFAULT 'product',    -- 'product' | 'batch' | 'unit'
  qr_data         TEXT NOT NULL,             -- encoded URL
  qr_image_url    TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- G6. passport_scans
-- Consumer scan analytics
CREATE TABLE passport_scans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_id     UUID NOT NULL REFERENCES product_passports(id),
  qr_code_id      UUID REFERENCES passport_qr_codes(id),
  scanned_at      TIMESTAMPTZ DEFAULT NOW(),
  ip_address      INET,
  user_agent      TEXT,
  country_code    TEXT,
  city            TEXT,
  device_type     TEXT,          -- 'mobile' | 'desktop' | 'tablet'
  referrer        TEXT
);


-- ============================================================
-- H. COMPLIANCE & REGULATIONS
-- ============================================================

-- H1. regulations
CREATE TABLE regulations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,   -- 'EU_DPP', 'CSRD', 'CSDDD', 'EUDR', 'REACH'
  name            TEXT NOT NULL,
  full_name       TEXT,
  jurisdiction    TEXT,                   -- 'EU', 'US', 'Global', 'UK'
  effective_date  DATE,
  mandatory_for   TEXT[],                -- ['brand', 'supplier', 'importer']
  description     TEXT,
  official_url    TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed key regulations
INSERT INTO regulations (code, name, full_name, jurisdiction, effective_date, mandatory_for) VALUES
  ('EU_DPP',  'EU Digital Product Passport', 'Regulation (EU) 2024/1781', 'EU', '2026-01-01', ARRAY['brand', 'importer']),
  ('CSRD',    'CSRD', 'Corporate Sustainability Reporting Directive', 'EU', '2024-01-01', ARRAY['brand', 'large_company']),
  ('CSDDD',   'CSDDD', 'Corporate Sustainability Due Diligence Directive', 'EU', '2027-01-01', ARRAY['brand', 'large_company']),
  ('EUDR',    'EUDR', 'EU Deforestation Regulation', 'EU', '2024-12-30', ARRAY['brand', 'importer', 'supplier']),
  ('REACH',   'REACH', 'Registration Evaluation Authorisation Chemicals', 'EU', '2007-06-01', ARRAY['brand', 'supplier']),
  ('UFLPA',   'UFLPA', 'Uyghur Forced Labor Prevention Act', 'US', '2022-06-21', ARRAY['brand', 'importer']),
  ('OEKO_TEX','OEKO-TEX', 'OEKO-TEX Standard 100', 'Global', NULL, ARRAY['supplier']),
  ('GOTS',    'GOTS',  'Global Organic Textile Standard', 'Global', NULL, ARRAY['supplier']),
  ('GRS',     'GRS',   'Global Recycled Standard', 'Global', NULL, ARRAY['supplier']);

-- H2. regulation_requirements
-- Specific requirements per regulation
CREATE TABLE regulation_requirements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regulation_id   UUID NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  req_code        TEXT NOT NULL,          -- 'DPP-001', 'CSRD-E1-01'
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,                   -- 'reporting', 'traceability', 'due_diligence'
  is_mandatory    BOOLEAN DEFAULT TRUE,
  evidence_needed TEXT[],                -- ['document', 'photo', 'data_report']
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- H3. compliance_controls
-- Internal controls to meet requirements
CREATE TABLE compliance_controls (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id         UUID NOT NULL REFERENCES organizations(id),
  requirement_id          UUID REFERENCES regulation_requirements(id),
  regulation_id           UUID REFERENCES regulations(id),
  control_name            TEXT NOT NULL,
  description             TEXT,
  control_type            TEXT,          -- 'preventive' | 'detective' | 'corrective'
  status                  compliance_status DEFAULT 'not_assessed',
  owner_id                UUID REFERENCES profiles(id),
  review_frequency        TEXT,          -- 'monthly', 'quarterly', 'annually'
  next_review_date        DATE,
  last_assessed_at        TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- H4. compliance_tasks
CREATE TABLE compliance_tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  control_id          UUID REFERENCES compliance_controls(id),
  regulation_id       UUID REFERENCES regulations(id),
  title               TEXT NOT NULL,
  description         TEXT,
  task_type           TEXT,        -- 'assessment', 'reporting', 'verification', 'training'
  status              TEXT DEFAULT 'not_started',   -- not_started | in_progress | completed | overdue
  priority            TEXT DEFAULT 'medium',        -- low | medium | high | critical
  assigned_to         UUID REFERENCES profiles(id),
  due_date            DATE,
  completed_at        TIMESTAMPTZ,
  completed_by        UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- H5. evidence_files
-- Documents supporting compliance
CREATE TABLE evidence_files (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  control_id          UUID REFERENCES compliance_controls(id),
  task_id             UUID REFERENCES compliance_tasks(id),
  file_name           TEXT NOT NULL,
  file_url            TEXT NOT NULL,
  file_type           TEXT,         -- 'pdf', 'xlsx', 'jpg', 'docx'
  file_size_bytes     INT,
  description         TEXT,
  valid_from          DATE,
  valid_until         DATE,
  uploaded_by         UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- H6. compliance_assessments
CREATE TABLE compliance_assessments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  regulation_id       UUID NOT NULL REFERENCES regulations(id),
  assessment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_score       DECIMAL(5,2),      -- 0-100
  status              compliance_status,
  findings            JSONB,             -- [{requirement, status, gap, recommendation}]
  assessed_by         UUID REFERENCES profiles(id),
  next_assessment_date DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- H7. compliance_incidents
CREATE TABLE compliance_incidents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  regulation_id       UUID REFERENCES regulations(id),
  title               TEXT NOT NULL,
  description         TEXT,
  incident_type       TEXT,          -- 'violation', 'near_miss', 'audit_finding'
  severity            risk_level DEFAULT 'medium',
  status              TEXT DEFAULT 'open',
  root_cause          TEXT,
  corrective_action   TEXT,
  reported_by         UUID REFERENCES profiles(id),
  assigned_to         UUID REFERENCES profiles(id),
  due_date            DATE,
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- H8. compliance_reports
CREATE TABLE compliance_reports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  regulation_id       UUID REFERENCES regulations(id),
  report_name         TEXT NOT NULL,
  report_type         TEXT,         -- 'csrd', 'gri', 'tcfd', 'custom'
  period_start        DATE,
  period_end          DATE,
  file_url            TEXT,
  status              TEXT DEFAULT 'draft',
  submitted_at        TIMESTAMPTZ,
  submitted_to        TEXT,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- I. RISK HUB
-- ============================================================

-- I1. risk_entities
-- Things being monitored for risk
CREATE TABLE risk_entities (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  entity_type         TEXT NOT NULL,    -- 'supplier', 'facility', 'material', 'shipment', 'country'
  entity_id           UUID,             -- references the actual record
  entity_name         TEXT NOT NULL,
  country             TEXT,
  is_monitored        BOOLEAN DEFAULT TRUE,
  monitoring_started_at TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- I2. risk_scores
-- Calculated risk scores per entity
CREATE TABLE risk_scores (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_entity_id      UUID NOT NULL REFERENCES risk_entities(id) ON DELETE CASCADE,
  overall_score       DECIMAL(5,2),     -- 0-100, higher = more risk
  risk_level          risk_level,
  financial_score     DECIMAL(5,2),
  operational_score   DECIMAL(5,2),
  supply_chain_score  DECIMAL(5,2),
  esg_score           DECIMAL(5,2),
  compliance_score    DECIMAL(5,2),
  cyber_score         DECIMAL(5,2),
  scored_at           TIMESTAMPTZ DEFAULT NOW(),
  scoring_method      TEXT DEFAULT 'ai',   -- 'ai' | 'manual' | 'hybrid'
  score_factors       JSONB,               -- what drove the score
  previous_score      DECIMAL(5,2),
  score_change        DECIMAL(5,2) GENERATED ALWAYS AS (overall_score - COALESCE(previous_score, overall_score)) STORED
);

-- I3. risk_alerts
CREATE TABLE risk_alerts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  risk_entity_id      UUID REFERENCES risk_entities(id),
  alert_type          TEXT NOT NULL,     -- 'score_spike', 'new_violation', 'country_risk', 'esg_incident'
  severity            alert_severity DEFAULT 'medium',
  title               TEXT NOT NULL,
  description         TEXT,
  status              TEXT DEFAULT 'new',    -- new | acknowledged | in_progress | resolved
  assigned_to         UUID REFERENCES profiles(id),
  detected_at         TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at     TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ,
  auto_generated      BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- I4. risk_categories
-- Configurable risk categories
CREATE TABLE risk_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,        -- 'Financial', 'ESG', 'Operational', 'Geopolitical'
  code        TEXT UNIQUE NOT NULL,
  weight      DECIMAL(4,3),         -- contribution to overall score
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE
);

INSERT INTO risk_categories (name, code, weight) VALUES
  ('Financial',    'financial',    0.25),
  ('Operational',  'operational',  0.25),
  ('Supply Chain', 'supply_chain', 0.20),
  ('ESG',          'esg',          0.15),
  ('Compliance',   'compliance',   0.10),
  ('Cyber',        'cyber',        0.05);

-- I5. risk_mitigations
CREATE TABLE risk_mitigations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  risk_alert_id       UUID REFERENCES risk_alerts(id),
  risk_entity_id      UUID REFERENCES risk_entities(id),
  title               TEXT NOT NULL,
  description         TEXT,
  action_plan         TEXT,
  owner_id            UUID REFERENCES profiles(id),
  due_date            DATE,
  status              TEXT DEFAULT 'planned',  -- planned | in_progress | completed | cancelled
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- I6. risk_history
-- Historical risk trend
CREATE TABLE risk_history (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_entity_id      UUID NOT NULL REFERENCES risk_entities(id),
  overall_score       DECIMAL(5,2),
  risk_level          risk_level,
  recorded_at         TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- J. SUSTAINABILITY & ESG
-- ============================================================

-- J1. sustainability_goals
CREATE TABLE sustainability_goals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  goal_name           TEXT NOT NULL,
  category            TEXT NOT NULL,     -- 'emissions', 'water', 'waste', 'social', 'energy'
  baseline_value      DECIMAL(14,4),
  baseline_year       INT,
  target_value        DECIMAL(14,4),
  target_unit         TEXT,
  target_year         INT,
  progress_pct        DECIMAL(5,2) DEFAULT 0,
  status              TEXT DEFAULT 'on_track',  -- on_track | at_risk | achieved | missed
  framework           TEXT,              -- 'SBTi', 'UN_SDG', 'CSRD', 'GRI'
  owner_id            UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- J2. emissions_data
-- Scope 1, 2, 3 emissions
CREATE TABLE emissions_data (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),
  scope               INT NOT NULL CHECK (scope IN (1, 2, 3)),
  category            TEXT,              -- for scope 3: 'purchased_goods', 'transport', 'waste'
  emission_source     TEXT,
  quantity_co2e       DECIMAL(14,4) NOT NULL,   -- in tonnes CO2 equivalent
  measurement_method  TEXT,             -- 'measured', 'calculated', 'estimated'
  data_quality        TEXT,             -- 'verified', 'estimated', 'proxy'
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  reporting_year      INT,
  is_verified         BOOLEAN DEFAULT FALSE,
  verified_by         UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- J3. energy_data
CREATE TABLE energy_data (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),
  energy_type         TEXT NOT NULL,     -- 'electricity', 'natural_gas', 'diesel', 'renewable'
  is_renewable        BOOLEAN DEFAULT FALSE,
  quantity_kwh        DECIMAL(14,4),
  quantity_mj         DECIMAL(14,4),
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  source              TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- J4. water_data
CREATE TABLE water_data (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),
  water_source        TEXT,              -- 'municipal', 'groundwater', 'rainwater', 'recycled'
  usage_cubic_meters  DECIMAL(14,4),
  recycled_pct        DECIMAL(5,2),
  effluent_volume     DECIMAL(14,4),
  effluent_treated_pct DECIMAL(5,2),
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- J5. waste_data
CREATE TABLE waste_data (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),
  waste_type          TEXT,              -- 'fabric_waste', 'chemical', 'packaging', 'general'
  total_waste_kg      DECIMAL(14,4),
  recycled_kg         DECIMAL(14,4),
  landfill_kg         DECIMAL(14,4),
  incinerated_kg      DECIMAL(14,4),
  diversion_rate_pct  DECIMAL(5,2) GENERATED ALWAYS AS
                      (CASE WHEN total_waste_kg > 0 THEN (recycled_kg / total_waste_kg) * 100 ELSE 0 END) STORED,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- J6. social_data
-- Labour, human rights, social metrics
CREATE TABLE social_data (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id         UUID NOT NULL REFERENCES organizations(id),
  facility_id             UUID REFERENCES facilities(id),
  reporting_period_start  DATE NOT NULL,
  reporting_period_end    DATE NOT NULL,
  total_workers           INT,
  female_workers          INT,
  migrant_workers         INT,
  minimum_wage_compliant  BOOLEAN,
  living_wage_paid        BOOLEAN,
  working_hours_compliant BOOLEAN,
  lost_time_incidents     INT DEFAULT 0,
  fatalities              INT DEFAULT 0,
  freedom_of_association  BOOLEAN,
  collective_bargaining   BOOLEAN,
  child_labor_risk        risk_level DEFAULT 'low',
  forced_labor_risk       risk_level DEFAULT 'low',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- J7. supplier_sustainability_scores
CREATE TABLE supplier_sustainability_scores (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_org_id        UUID NOT NULL REFERENCES organizations(id),
  supplier_org_id     UUID NOT NULL REFERENCES organizations(id),
  overall_score       DECIMAL(5,2),      -- 0-100
  environment_score   DECIMAL(5,2),
  social_score        DECIMAL(5,2),
  governance_score    DECIMAL(5,2),
  scored_at           TIMESTAMPTZ DEFAULT NOW(),
  next_assessment_date DATE,
  scoring_method      TEXT DEFAULT 'platform',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- J8. sustainability_reports
CREATE TABLE sustainability_reports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  report_name         TEXT NOT NULL,
  framework           TEXT NOT NULL,     -- 'GRI', 'SASB', 'TCFD', 'CDP', 'CSRD'
  reporting_year      INT NOT NULL,
  period_start        DATE,
  period_end          DATE,
  status              TEXT DEFAULT 'draft',    -- draft | review | published
  file_url            TEXT,
  published_at        TIMESTAMPTZ,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- K. VERIFICATION MARKETPLACE
-- ============================================================

-- K1. verification_requests
CREATE TABLE verification_requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number      TEXT UNIQUE,       -- 'VR-2024-00001'
  buyer_org_id        UUID NOT NULL REFERENCES organizations(id),
  supplier_org_id     UUID NOT NULL REFERENCES organizations(id),
  facility_id         UUID REFERENCES facilities(id),

  verification_type   TEXT NOT NULL,     -- 'physical', 'certificate', 'material', 'capacity', 'esg', 'social', 'supply_chain'
  scope               TEXT,
  requirements        JSONB,             -- specific items to verify
  standards           TEXT[],            -- ['GOTS', 'ISO14001']

  -- Dates
  requested_date      DATE DEFAULT CURRENT_DATE,
  preferred_date      DATE,
  deadline_date       DATE,

  -- Budget
  budget_min_usd      DECIMAL(10,2),
  budget_max_usd      DECIMAL(10,2),

  status              TEXT DEFAULT 'open',   -- open | assigned | in_progress | completed | cancelled
  priority            TEXT DEFAULT 'normal',

  notes               TEXT,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate VR number
CREATE SEQUENCE vr_number_seq START 1;
CREATE OR REPLACE FUNCTION generate_vr_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'VR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('vr_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vr_number
BEFORE INSERT ON verification_requests
FOR EACH ROW
WHEN (NEW.request_number IS NULL)
EXECUTE FUNCTION generate_vr_number();

-- K2. verification_assignments
-- Auditor assigned to a request
CREATE TABLE verification_assignments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id          UUID NOT NULL REFERENCES verification_requests(id),
  auditor_org_id      UUID NOT NULL REFERENCES organizations(id),
  auditor_user_id     UUID REFERENCES profiles(id),
  assigned_at         TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date      DATE,
  quoted_price_usd    DECIMAL(10,2),
  status              TEXT DEFAULT 'assigned',   -- assigned | accepted | rejected | completed
  accepted_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  man_days            DECIMAL(4,1),
  notes               TEXT
);

-- K3. audit_reports
CREATE TABLE audit_reports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id       UUID NOT NULL REFERENCES verification_assignments(id),
  request_id          UUID NOT NULL REFERENCES verification_requests(id),
  report_title        TEXT NOT NULL,
  overall_rating      TEXT,              -- 'pass', 'pass_with_conditions', 'fail'
  score               DECIMAL(5,2),
  findings            JSONB,             -- [{category, finding, severity, recommendation}]
  corrective_actions  JSONB,
  audit_date          DATE,
  file_url            TEXT,
  digital_signature   TEXT,             -- auditor's digital signature hash
  is_published        BOOLEAN DEFAULT FALSE,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- K4. auditor_profiles
CREATE TABLE auditor_profiles (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES profiles(id),
  organization_id         UUID REFERENCES organizations(id),
  specializations         TEXT[],        -- ['social_compliance', 'environmental', 'quality']
  certifications          TEXT[],        -- ['ISO_9001_lead_auditor', 'SA8000']
  countries_of_operation  TEXT[],
  languages               TEXT[],
  years_experience        INT,
  total_audits_completed  INT DEFAULT 0,
  average_rating          DECIMAL(3,2),
  is_approved             BOOLEAN DEFAULT FALSE,
  approved_at             TIMESTAMPTZ,
  approved_by             UUID REFERENCES profiles(id),
  bio                     TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- K5. verification_pricing
-- Bidding records
CREATE TABLE verification_pricing (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id          UUID NOT NULL REFERENCES verification_requests(id),
  auditor_org_id      UUID NOT NULL REFERENCES organizations(id),
  quoted_price_usd    DECIMAL(10,2) NOT NULL,
  man_days            DECIMAL(4,1),
  proposed_date       DATE,
  notes               TEXT,
  status              TEXT DEFAULT 'submitted',  -- submitted | accepted | rejected
  submitted_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- L. NOTIFICATIONS & ALERTS
-- ============================================================

-- L1. alert_rules
CREATE TABLE alert_rules (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  name                TEXT NOT NULL,
  description         TEXT,
  module              TEXT NOT NULL,    -- 'risk', 'compliance', 'order', 'material', 'sustainability'
  condition_type      TEXT NOT NULL,    -- 'threshold', 'date_trigger', 'event', 'anomaly'
  condition_config    JSONB NOT NULL,   -- {"field": "risk_score", "operator": ">", "value": 80}
  severity            alert_severity DEFAULT 'medium',
  notify_roles        TEXT[],           -- ['brand_admin', 'supplier_admin']
  notify_users        UUID[],
  channels            TEXT[] DEFAULT ARRAY['in_app', 'email'],
  is_active           BOOLEAN DEFAULT TRUE,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- L2. notifications
CREATE TABLE notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID REFERENCES organizations(id),
  user_id             UUID REFERENCES profiles(id),
  alert_rule_id       UUID REFERENCES alert_rules(id),
  title               TEXT NOT NULL,
  body                TEXT,
  severity            alert_severity DEFAULT 'info',
  module              TEXT,
  entity_type         TEXT,
  entity_id           UUID,
  action_url          TEXT,             -- deep link to relevant page
  is_read             BOOLEAN DEFAULT FALSE,
  read_at             TIMESTAMPTZ,
  channel             TEXT DEFAULT 'in_app',   -- in_app | email | sms | slack | webhook
  sent_at             TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- L3. notification_preferences
CREATE TABLE notification_preferences (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module              TEXT NOT NULL,
  event_type          TEXT NOT NULL,
  in_app_enabled      BOOLEAN DEFAULT TRUE,
  email_enabled       BOOLEAN DEFAULT TRUE,
  sms_enabled         BOOLEAN DEFAULT FALSE,
  slack_enabled       BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module, event_type)
);


-- ============================================================
-- M. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE organizations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_declarations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_relationships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_chain_tiers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_certifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_chain_maps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE unauthorized_flags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_milestones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_allocations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_wallets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances             ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_balance_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_requirements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_gaps               ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_certificates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_line_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_verifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_blockchain_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_documents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_transfers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_passports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_materials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_supply_chain       ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_sustainability     ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_qr_codes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_controls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files              ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_assessments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_incidents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_entities               ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_mitigations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_history                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE emissions_data              ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_data                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_data                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_data                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_data                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_sustainability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports               ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditor_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_pricing        ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences    ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's organization_id
CREATE OR REPLACE FUNCTION auth.org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: check if user is platform admin
CREATE OR REPLACE FUNCTION auth.is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    JOIN roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid() AND r.name = 'platform_admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- Core RLS Policies ----

-- organizations: user can see their own org
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = auth.org_id() OR auth.is_platform_admin());

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = auth.org_id());

-- profiles: user sees own profile + teammates
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    organization_id = auth.org_id()
    OR id = auth.uid()
    OR auth.is_platform_admin()
  );

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- organization_members
CREATE POLICY "members_select" ON organization_members
  FOR SELECT USING (organization_id = auth.org_id() OR auth.is_platform_admin());

-- facilities: own org's facilities
CREATE POLICY "facilities_select" ON facilities
  FOR SELECT USING (organization_id = auth.org_id() OR auth.is_platform_admin());

CREATE POLICY "facilities_insert" ON facilities
  FOR INSERT WITH CHECK (organization_id = auth.org_id());

CREATE POLICY "facilities_update" ON facilities
  FOR UPDATE USING (organization_id = auth.org_id());

-- transaction_certificates: issuer OR receiver can see
CREATE POLICY "tc_select" ON transaction_certificates
  FOR SELECT USING (
    issuer_org_id = auth.org_id()
    OR receiver_org_id = auth.org_id()
    OR organization_id = auth.org_id()
    OR auth.is_platform_admin()
  );

CREATE POLICY "tc_insert" ON transaction_certificates
  FOR INSERT WITH CHECK (organization_id = auth.org_id());

CREATE POLICY "tc_update" ON transaction_certificates
  FOR UPDATE USING (organization_id = auth.org_id());

-- product_passports: own org only (consumer view is via public function)
CREATE POLICY "passport_select" ON product_passports
  FOR SELECT USING (organization_id = auth.org_id() OR auth.is_platform_admin());

CREATE POLICY "passport_insert" ON product_passports
  FOR INSERT WITH CHECK (organization_id = auth.org_id());

-- passport_scans: public insert (no auth needed for consumer scans)
CREATE POLICY "passport_scans_insert" ON passport_scans
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "passport_scans_select" ON passport_scans
  FOR SELECT USING (
    passport_id IN (SELECT id FROM product_passports WHERE organization_id = auth.org_id())
  );

-- Generic org-scoped policy template for remaining tables
-- (organization_id = auth.org_id())
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'supplier_relationships', 'supply_chain_tiers', 'subcontractors',
    'orders', 'order_items', 'order_milestones', 'order_allocations',
    'shipments', 'exceptions', 'material_wallets', 'wallet_balances',
    'material_transactions', 'mass_balance_records', 'material_requirements',
    'material_gaps', 'compliance_controls', 'compliance_tasks', 'evidence_files',
    'compliance_assessments', 'compliance_incidents', 'compliance_reports',
    'risk_entities', 'risk_alerts', 'risk_mitigations',
    'sustainability_goals', 'emissions_data', 'energy_data', 'water_data',
    'waste_data', 'social_data', 'supplier_sustainability_scores',
    'sustainability_reports', 'verification_requests',
    'alert_rules', 'notifications', 'audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls
  LOOP
    EXECUTE format(
      'CREATE POLICY "%s_org_select" ON %I FOR SELECT USING (organization_id = auth.org_id() OR auth.is_platform_admin())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_org_insert" ON %I FOR INSERT WITH CHECK (organization_id = auth.org_id())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_org_update" ON %I FOR UPDATE USING (organization_id = auth.org_id())',
      tbl, tbl
    );
  END LOOP;
END $$;

-- notifications: user sees own notifications
CREATE POLICY "notifications_own" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR organization_id = auth.org_id());

-- notification_preferences: own only
CREATE POLICY "notif_prefs_own" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- N. INDEXES (Performance)
-- ============================================================

-- Organizations
CREATE INDEX idx_org_slug ON organizations(slug);
CREATE INDEX idx_org_type ON organizations(org_type);

-- Profiles
CREATE INDEX idx_profiles_org ON profiles(organization_id);

-- Organization members
CREATE INDEX idx_members_org ON organization_members(organization_id);
CREATE INDEX idx_members_user ON organization_members(user_id);

-- Facilities
CREATE INDEX idx_facilities_org ON facilities(organization_id);
CREATE INDEX idx_facilities_type ON facilities(facility_type);
CREATE INDEX idx_facilities_country ON facilities(country);
CREATE INDEX idx_facilities_geo ON facilities(latitude, longitude);

-- Supply chain
CREATE INDEX idx_supplier_rel_brand ON supplier_relationships(brand_org_id);
CREATE INDEX idx_supplier_rel_supplier ON supplier_relationships(supplier_org_id);
CREATE INDEX idx_chain_tiers_brand ON supply_chain_tiers(brand_org_id);

-- Orders
CREATE INDEX idx_orders_org ON orders(organization_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_org_id);
CREATE INDEX idx_orders_supplier ON orders(supplier_org_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_ship_date ON orders(required_ship_date);

-- Shipments
CREATE INDEX idx_shipments_org ON shipments(organization_id);
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- Material wallet
CREATE INDEX idx_wallet_org ON material_wallets(organization_id);
CREATE INDEX idx_wallet_bal_wallet ON wallet_balances(wallet_id);
CREATE INDEX idx_mat_tx_wallet ON material_transactions(wallet_id);
CREATE INDEX idx_mat_tx_date ON material_transactions(transaction_date);
CREATE INDEX idx_mat_tx_ref ON material_transactions(reference_type, reference_id);

-- Transaction Certificates
CREATE INDEX idx_tc_org ON transaction_certificates(organization_id);
CREATE INDEX idx_tc_issuer ON transaction_certificates(issuer_org_id);
CREATE INDEX idx_tc_receiver ON transaction_certificates(receiver_org_id);
CREATE INDEX idx_tc_status ON transaction_certificates(tc_status);
CREATE INDEX idx_tc_number ON transaction_certificates(tc_number);
CREATE INDEX idx_tc_issue_date ON transaction_certificates(issue_date);

-- Digital Product Passport
CREATE INDEX idx_passport_org ON product_passports(organization_id);
CREATE INDEX idx_passport_sku ON product_passports(product_sku);
CREATE INDEX idx_passport_status ON product_passports(status);
CREATE INDEX idx_passport_scans_passport ON passport_scans(passport_id);
CREATE INDEX idx_passport_scans_time ON passport_scans(scanned_at);

-- Compliance
CREATE INDEX idx_comp_controls_org ON compliance_controls(organization_id);
CREATE INDEX idx_comp_tasks_org ON compliance_tasks(organization_id);
CREATE INDEX idx_comp_tasks_status ON compliance_tasks(status);
CREATE INDEX idx_comp_tasks_due ON compliance_tasks(due_date);
CREATE INDEX idx_comp_incidents_org ON compliance_incidents(organization_id);

-- Risk
CREATE INDEX idx_risk_entities_org ON risk_entities(organization_id);
CREATE INDEX idx_risk_scores_entity ON risk_scores(risk_entity_id);
CREATE INDEX idx_risk_alerts_org ON risk_alerts(organization_id);
CREATE INDEX idx_risk_alerts_status ON risk_alerts(status);

-- Sustainability
CREATE INDEX idx_emissions_org ON emissions_data(organization_id);
CREATE INDEX idx_emissions_scope ON emissions_data(scope);
CREATE INDEX idx_emissions_period ON emissions_data(period_start, period_end);

-- Verification
CREATE INDEX idx_vr_buyer ON verification_requests(buyer_org_id);
CREATE INDEX idx_vr_supplier ON verification_requests(supplier_org_id);
CREATE INDEX idx_vr_status ON verification_requests(status);

-- Notifications
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_org ON notifications(organization_id);
CREATE INDEX idx_notif_read ON notifications(is_read);
CREATE INDEX idx_notif_sent ON notifications(sent_at DESC);

-- Audit logs
CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);


-- ============================================================
-- O. HELPER FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'organizations', 'profiles', 'facilities', 'facility_certifications',
    'supplier_relationships', 'orders', 'shipments', 'transaction_certificates',
    'product_passports', 'compliance_controls', 'compliance_tasks',
    'compliance_incidents', 'sustainability_reports', 'sustainability_goals',
    'verification_requests', 'audit_reports', 'auditor_profiles',
    'risk_mitigations', 'alert_rules', 'notification_preferences',
    'exceptions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at_%s BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Auto-create profile when user signs up (Supabase Auth hook)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function: update wallet balance after each transaction
CREATE OR REPLACE FUNCTION sync_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate balance from all transactions
  UPDATE wallet_balances
  SET balance_qty = (
    SELECT COALESCE(SUM(
      CASE
        WHEN transaction_type IN ('credit', 'opening_balance') THEN quantity
        WHEN transaction_type IN ('debit', 'reservation')     THEN -quantity
        WHEN transaction_type = 'adjustment'                  THEN quantity
        ELSE 0
      END
    ), 0)
    FROM material_transactions
    WHERE wallet_id = NEW.wallet_id
      AND material_id = NEW.material_id
  ),
  last_updated_at = NOW()
  WHERE wallet_id = NEW.wallet_id
    AND material_id = NEW.material_id;

  -- Insert balance row if it doesn't exist
  INSERT INTO wallet_balances (wallet_id, material_id, balance_qty)
  VALUES (NEW.wallet_id, NEW.material_id, 0)
  ON CONFLICT (wallet_id, material_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_wallet_balance
AFTER INSERT ON material_transactions
FOR EACH ROW EXECUTE FUNCTION sync_wallet_balance();

-- Function: log important changes to audit_logs automatically
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(),
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::JSONB ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to critical tables
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'transaction_certificates', 'product_passports',
    'compliance_incidents', 'unauthorized_flags',
    'verification_requests', 'audit_reports'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION log_audit_event()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Function: public consumer access to published DPP (no auth required)
CREATE OR REPLACE FUNCTION get_public_passport(p_passport_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id',               pp.id,
    'product_name',     pp.product_name,
    'product_sku',      pp.product_sku,
    'product_category', pp.product_category,
    'material_composition', pp.material_composition,
    'country_of_origin', pp.country_of_origin,
    'carbon_footprint_kg', pp.carbon_footprint_kg,
    'care_instructions', pp.care_instructions,
    'recyclability_info', pp.recyclability_info,
    'published_at',     pp.published_at,
    'supply_chain',     (
      SELECT jsonb_agg(jsonb_build_object(
        'tier_level',    psc.tier_level,
        'process_type',  psc.process_type,
        'country',       psc.country,
        'display_name',  psc.display_name
      ) ORDER BY psc.sequence_order)
      FROM passport_supply_chain psc
      WHERE psc.passport_id = pp.id AND psc.is_visible_to_public = TRUE
    ),
    'sustainability',   (
      SELECT jsonb_agg(jsonb_build_object(
        'metric',  ps.metric_name,
        'value',   ps.metric_value,
        'unit',    ps.metric_unit,
        'verified', ps.is_verified
      ))
      FROM passport_sustainability ps
      WHERE ps.passport_id = pp.id
    )
  ) INTO result
  FROM product_passports pp
  WHERE pp.id = p_passport_id
    AND pp.status = 'published';

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SCHEMA COMPLETE
-- Total tables: 65
-- Sections: A-O
-- Version: 1.0 | 2026-08-06
-- ============================================================
