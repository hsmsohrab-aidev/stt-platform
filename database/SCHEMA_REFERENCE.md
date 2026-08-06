# STT Platform — Database Schema Reference
> AI এবং developer উভয়ের জন্য। কোড লেখার আগে এই file পড়ো।
> Full SQL: `database/schema.sql` | Version: 1.0

---

## Quick Navigation
- [A. Organizations & Users](#a-organizations--users)
- [B. Supply Chain](#b-supply-chain)
- [C. Orders & Logistics](#c-orders--logistics)
- [D. Material Wallet](#d-material-wallet)
- [E. Transaction Certificates](#e-transaction-certificates)
- [F. Digital Product Passport](#f-digital-product-passport)
- [G. Compliance](#g-compliance)
- [H. Risk Hub](#h-risk-hub)
- [I. Sustainability & ESG](#i-sustainability--esg)
- [J. Verification Marketplace](#j-verification-marketplace)
- [K. Notifications](#k-notifications)
- [Key Relationships](#key-relationships)
- [Important Rules](#important-rules)

---

## A. Organizations & Users

### `organizations`
**কী:** Platform-এর প্রতিটি company (brand, supplier, auditor, etc.)
**Primary key:** `id UUID`
**Key fields:**
- `org_type` → `brand | supplier | auditor | logistics | regulator | financial | platform_admin`
- `subscription_plan` → `view_access | facility_membership | importer_supply_chain | buyer_brand | enterprise`
- `slug` → URL-safe unique name (e.g., `"hm-group"`)
- `onboarding_completed` → FALSE মানে এখনো setup শেষ হয়নি

**Use when:** নতুন company register করলে, company info দেখাতে হলে

---

### `profiles`
**কী:** Supabase `auth.users` এর extension — extra user info
**Primary key:** `id UUID` (same as `auth.users.id`)
**Key fields:**
- `organization_id` → কোন org-এ আছে
- `full_name`, `job_title`, `department`
- `preferred_language` → `'en' | 'bn' | 'zh'`
**Note:** User signup হলে `handle_new_user()` trigger automatically এই table-এ row তৈরি করে

---

### `roles`
**কী:** RBAC roles
**Pre-seeded roles:**
```
platform_admin    → সব কিছু
brand_admin       → brand-এর সব
brand_viewer      → brand read-only
supplier_admin    → supplier-এর সব
supplier_operator → supplier daily ops
auditor_lead      → full auditor access
auditor_field     → শুধু assigned jobs
logistics_operator → shipment update
regulator_viewer  → read-only
financial_analyst → ESG + financial data
```

---

### `organization_members`
**কী:** User কোন org-এ কোন role-এ আছে
**Key fields:**
- `is_owner` → TRUE হলে org owner (সর্বোচ্চ permission)
- `role_id` → `roles` table-এর reference

---

### `audit_logs`
**কী:** সব important action-এর immutable log
**Auto-populated by:** `log_audit_event()` trigger (TC, DPP, compliance incidents, etc.)
**Never delete rows from this table**

---

## B. Supply Chain

### `facilities`
**কী:** Physical location — factory, mill, dyeing unit, etc.
**Key fields:**
- `facility_type` → `raw_material_source | spinning_mill | knitting_unit | weaving_unit | dyeing_unit | printing_unit | fabric_supplier | garment_factory | washing_unit | finishing_unit | packing_logistics | warehouse`
- `tier_level` → `tier_1 | tier_2 | tier_3 | tier_4 | tier_5 | tier_6`
- `is_verified` → STT team বা auditor verify করেছে কিনা
- `certifications` → `['GOTS', 'OCS', 'ISO9001']` array

---

### `supplier_relationships`
**কী:** Brand ↔ Supplier formal connection
**Key fields:**
- `brand_org_id` → brand
- `supplier_org_id` → supplier
- `tier_level` → এই supplier brand-এর কোন tier-এ
**Unique:** `(brand_org_id, supplier_org_id)` — একই pair দুইবার নয়

---

### `supply_chain_tiers`
**কী:** Brand-এর পুরো supply chain map — কোন tier-এ কে আছে
**Use when:** Supply chain visualization tree বানাতে হলে

---

### `unauthorized_flags`
**কী:** AI-detected anomaly — undeclared factory, unauthorized subcontracting
**Key fields:**
- `confidence_score` → 0.000 to 1.000 (AI certainty)
- `detected_by` → `'ai' | 'auditor' | 'system'`
- `status` → `open | resolved | false_positive`

---

## C. Orders & Logistics

### `orders`
**কী:** Purchase order master record
**Key fields:**
- `buyer_org_id` → brand (কে order করেছে)
- `supplier_org_id` → supplier (কে বানাবে)
- `status` → `draft | confirmed | in_production | shipped | delivered | cancelled`
- `on_time_status` → `on_time | at_risk | delayed`
- `completion_pct` → 0-100%

---

### `order_items`
**কী:** Order-এর line items (individual styles/products)
**Key fields:**
- `material_composition` → JSON: `[{"material": "cotton", "pct": 60}, {"material": "polyester", "pct": 40}]`
- `size_breakdown` → JSON: `{"S": 100, "M": 200, "L": 150}`
- `gsm` → fabric weight (grams per square meter)

---

### `shipments`
**কী:** Physical shipment record
**Key fields:**
- `status` → `pending | in_transit | customs | delivered | exception`
- `etd` / `eta` → estimated departure/arrival
- `current_latitude`, `current_longitude` → live GPS location

---

### `shipment_events`
**কী:** Real-time movement log for each shipment
**Key fields:**
- `event_type` → `departed | arrived_port | customs_cleared | delivered`
- `source` → `manual | gps | api | iot`
**Use when:** Live tracking timeline দেখাতে হলে

---

### `exceptions`
**কী:** Delays, quality issues, compliance problems on orders/shipments
**Severity:** `low | medium | high | critical`

---

## D. Material Wallet

### `materials` (seeded)
**কী:** Material master list — pre-populated
**Pre-seeded:** Organic Cotton, BCI Cotton, Recycled Polyester, Viscose, Elastane, etc.
**Do not duplicate** — always reference existing materials

---

### `material_wallets`
**কী:** Organization-এর wallet (one per org, optionally per facility)
**Unique:** `(organization_id, facility_id)`

---

### `wallet_balances`
**কী:** Current balance per material per wallet
**⚠️ IMPORTANT:**
- `available_qty` is a **GENERATED COLUMN** — কখনো manually update করবে না
- `available_qty = balance_qty - reserved_qty`
- Balance `sync_wallet_balance()` trigger দিয়ে auto-update হয়

---

### `material_transactions`
**কী:** প্রতিটি material debit/credit
**`transaction_type`:**
- `credit` → material wallet-এ আসলে
- `debit` → TC issue করলে বা order-এ ব্যবহার হলে
- `reservation` → order confirmed কিন্তু TC এখনো issue হয়নি
- `adjustment` → manual correction
- `opening_balance` → initial balance setup
**⚠️ IMPORTANT:** Insert করলে `sync_wallet_balance()` trigger automatically `wallet_balances` update করে

---

### `mass_balance_records`
**কী:** Period-wise mass balance calculation
**`closing_balance`:** Generated column = `opening + received - consumed - issued`
**Use when:** Mass balance report বানাতে হলে, GOTS/OCS audit করতে হলে

---

## E. Transaction Certificates

### `transaction_certificates`
**কী:** Material transfer-এর digital certificate
**`tc_number`:** Auto-generated by DB trigger → format: `TC-2026-000001`
**`tc_status`:** `draft → issued → transferred → verified → rejected | expired`
**Key fields:**
- `issuer_org_id` → যে TC দিচ্ছে (supplier)
- `receiver_org_id` → যে TC পাচ্ছে (brand বা next supplier)
- `blockchain_tx_id` → Phase 2-তে Hyperledger Fabric TX ID
- `is_blockchain_anchored` → FALSE (Phase 1), TRUE (Phase 2)
- `pdf_url` → generated PDF in Supabase Storage
- `qr_code_url` → QR code image

**⚠️ WORKFLOW:**
```
1. Supplier TC draft করে
2. Issue করলে → material_transactions-এ debit হয়
3. Brand verify করলে → status = 'verified'
4. Phase 2: blockchain-এ anchor → is_blockchain_anchored = TRUE
```

---

### `tc_line_items`
**কী:** TC-র মধ্যে কোন কোন material কতটুকু
**Key fields:**
- `certification` → `'GOTS' | 'OCS' | 'GRS' | 'RCS'`
- `cert_percentage` → certified content percentage
- `hs_code` → customs Harmonized System code

---

### `tc_blockchain_records`
**কী:** Blockchain anchoring record (Phase 2)
**Key fields:**
- `tx_id` → Hyperledger Fabric transaction ID
- `document_hash` → SHA-256 hash of TC data
- `block_number` → block number on chain

---

## F. Digital Product Passport

### `product_passports`
**কী:** EU DPP compliant product passport
**`status`:** `draft → published → archived`
**Key fields:**
- `dpp_regulation` → `'EU_2024_1781'` (Regulation 2024/1781)
- `material_composition` → JSON array of materials
- `gtin` → barcode/EAN
- `public_url` → `https://stt-platform.com/p/{id}` (consumer QR link)

**⚠️ Consumer access:** `get_public_passport(id)` DB function — NO auth required
**⚠️ Status 'published' করলে:** `published_at` timestamp set করো

---

### `passport_supply_chain`
**কী:** Consumer-দের জন্য supply chain story
**Key fields:**
- `is_visible_to_public` → FALSE হলে consumer দেখতে পাবে না (sensitive facility)
- `sequence_order` → display order (1=raw material, last=retail)
- `display_name` → anonymized name (actual facility name expose না করতে চাইলে)

---

### `passport_scans`
**কী:** Consumer QR scan analytics
**No auth required for INSERT** (RLS policy: `WITH CHECK (TRUE)`)
**Use when:** Scan count, geography, device analytics দেখাতে হলে

---

## G. Compliance

### `regulations` (seeded)
**Pre-seeded:**
```
EU_DPP   → EU Digital Product Passport (2026)
CSRD     → Corporate Sustainability Reporting Directive (2024)
CSDDD    → Corporate Sustainability Due Diligence Directive (2027)
EUDR     → EU Deforestation Regulation (2024)
REACH    → Chemicals regulation
UFLPA    → US Uyghur Forced Labor Prevention Act
GOTS, GRS, OEKO-TEX
```

---

### `compliance_tasks`
**কী:** Actionable to-do items for compliance
**`status`:** `not_started | in_progress | completed | overdue`
**`task_type`:** `assessment | reporting | verification | training`

---

### `compliance_incidents`
**কী:** Violations, near-misses, audit findings
**⚠️ Auto audit-logged** via `log_audit_event()` trigger

---

## H. Risk Hub

### `risk_entities`
**কী:** যা monitor করা হচ্ছে (supplier, facility, material, country)
**`entity_type`:** `supplier | facility | material | shipment | country`
**`entity_id`:** সেই record-এর UUID (optional — external entities হলে NULL)

---

### `risk_scores`
**কী:** Calculated risk scores per entity
**Score range:** 0-100 (higher = more risk)
**`score_change`:** Generated column = `overall_score - previous_score`
**Categories:** Financial (25%), Operational (25%), Supply Chain (20%), ESG (15%), Compliance (10%), Cyber (5%)

---

### `risk_categories` (seeded)
```
financial    → 25% weight
operational  → 25% weight
supply_chain → 20% weight
esg          → 15% weight
compliance   → 10% weight
cyber        → 5% weight
```

---

## I. Sustainability & ESG

### `emissions_data`
**কী:** Scope 1, 2, 3 carbon emissions
**`scope`:** `1 | 2 | 3`
**`quantity_co2e`:** tonnes of CO2 equivalent
**Scope 3 categories:** `purchased_goods | transport | waste | business_travel | ...`

---

### `social_data`
**কী:** Labour, human rights metrics per facility
**Key fields:**
- `minimum_wage_compliant`, `living_wage_paid`, `working_hours_compliant`
- `child_labor_risk`, `forced_labor_risk` → `low | medium | high | critical`
- `lost_time_incidents`, `fatalities`

---

### `supplier_sustainability_scores`
**কী:** Brand কর্তৃক supplier-এর ESG score
**Score range:** 0-100 per category (environment, social, governance, overall)

---

## J. Verification Marketplace

### `verification_requests`
**কী:** Brand কর্তৃক raise করা verification request
**`request_number`:** Auto-generated → `VR-2026-00001`
**`verification_type`:** `physical | certificate | material | capacity | esg | social | supply_chain`
**`status`:** `open → assigned → in_progress → completed | cancelled`

---

### `verification_assignments`
**কী:** Auditor assigned to a request
**Flow:** Request open → Auditor bids (verification_pricing) → Buyer accepts → Assignment created

---

### `audit_reports`
**কী:** Completed audit report
**`overall_rating`:** `pass | pass_with_conditions | fail`
**`digital_signature`:** Auditor-এর cryptographic signature hash
**⚠️ Auto audit-logged** via trigger

---

### `auditor_profiles`
**কী:** Auditor credentials ও specializations
**`is_approved`:** FALSE হলে platform-এ bid করতে পারবে না

---

## K. Notifications

### `notifications`
**`channel`:** `in_app | email | sms | slack | webhook`
**`is_read`:** FALSE = unread (badge count-এ দেখাবে)

---

## Key Relationships

```
organizations
  ├── profiles (1:many)
  ├── organization_members (1:many)
  ├── facilities (1:many)
  ├── material_wallets (1:1 or 1:many by facility)
  │     └── wallet_balances (1:many)
  │           └── [updated by] material_transactions
  ├── orders (1:many as buyer or supplier)
  │     ├── order_items (1:many)
  │     ├── order_milestones (1:many)
  │     └── shipments (1:many)
  │           └── shipment_events (1:many)
  └── transaction_certificates (1:many as issuer or receiver)
        ├── tc_line_items (1:many)
        ├── tc_verifications (1:many)
        ├── tc_blockchain_records (1:1)
        └── tc_documents (1:many)

product_passports
  ├── passport_materials → materials + transaction_certificates
  ├── passport_supply_chain → facilities
  ├── passport_sustainability
  ├── passport_qr_codes
  └── passport_scans

verification_requests
  ├── verification_assignments → auditor_profiles
  ├── audit_reports
  └── verification_pricing
```

---

## Important Rules

### ১. Balance কখনো negative হবে না
```typescript
// TC issue করার আগে সবসময় check করো
const balance = await getAvailableBalance(walletId, materialId);
if (balance < requiredQuantity) {
  throw new InsufficientBalanceException();
}
```

### ২. Organization isolation সবসময়
```typescript
// ✅ সঠিক
const orders = await supabase
  .from('orders')
  .select('*')
  // RLS automatically filters by org — but add for NestJS too:
  .eq('organization_id', user.organizationId);

// ❌ ভুল — org filter নেই
const orders = await supabase.from('orders').select('*');
```

### ৩. TC issue করার flow
```
1. Check wallet balance >= required quantity
2. Create TC record (status: 'draft')
3. Create tc_line_items
4. Issue TC (status: 'issued')
5. Create material_transaction (type: 'debit') ← trigger updates balance
6. Generate PDF → upload to Supabase Storage → update tc.pdf_url
7. Generate QR code → update tc.qr_code_url
8. Notify receiver via notification
```

### ৪. DPP publish করার flow
```
1. Collect all material data (passport_materials + TCs)
2. Build supply chain (passport_supply_chain)
3. Add sustainability metrics (passport_sustainability)
4. Generate QR code (passport_qr_codes)
5. Set status = 'published', published_at = NOW()
6. Public URL: /p/{passport_id} → calls get_public_passport()
```

### ৫. Generated columns — কখনো manually update করবে না
- `wallet_balances.available_qty`
- `mass_balance_records.closing_balance`
- `waste_data.diversion_rate_pct`
- `risk_scores.score_change`

### ৬. Seeded data — duplicate করবে না
এগুলো schema.sql-এ already আছে, code দিয়ে আবার insert করবে না:
- `roles` (11টি default role)
- `materials` (13টি common material)
- `regulations` (9টি regulation)
- `risk_categories` (6টি category)

---

*Last updated: 2026-08-06 | schema.sql v1.0*
