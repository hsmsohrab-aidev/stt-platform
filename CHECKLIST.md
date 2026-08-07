# STT Platform — Execution Checklist
> Phase 0 → Phase 1 ধাপে ধাপে। প্রতিটি কাজ শেষে `[x]` মার্ক করো।
> Design source of truth: `docs/DESIGN_SYSTEM.md` + `docs/STT_Interactive_Prototype.html`
> Last updated: 2026-08-07

## Phase 0 — Foundation
- [x] 0.0–0.6 complete (planning, GitHub, Supabase, monorepo, design system, auth, CI)

## Design lock
- [x] `docs/DESIGN_SYSTEM.md` written from interactive prototype
- [x] Prototype copied to `docs/STT_Interactive_Prototype.html`
- [x] `.cursor/rules` points to design system
- [x] App theme/fonts/shell/login synced to prototype tokens

## Phase 1 — MVP

### Step 1.1 — Core Database Schema
- [x] Auth tables + RLS helpers
- [x] facilities + supply-chain tables
- [x] materials (13 seeded) + wallets + balances + transactions + mass_balance
- [x] TC + line items + verifications + documents + invitations
- [x] Wallet sync trigger + TC number generator

### Step 1.2 — Organization Onboarding
- [x] `/onboarding` — create org (brand/supplier/auditor)
- [x] Link profile + owner membership + default admin role
- [x] Auto-create material wallet for brand/supplier
- [x] Middleware redirects users without org → `/onboarding`
- [x] 5-phase checklist UI (prototype-aligned)

### Step 1.3 — Facility Declaration
- [x] `/facilities` list + declare form (type, tier, location)
- [x] Org-scoped RLS queries

### Step 1.4 — Material Wallet
- [x] `/wallet` balance cards + ledger
- [x] Credit transaction (trigger updates balances)

### Step 1.5 — TC Issuance
- [x] `/tc` list + issue form
- [x] Balance check before issue + debit on issue
- [x] Auto TC number (`TC-YYYY-######`)
- [ ] PDF + QR generation (polish)
- [ ] Receiver org picker UI (currently UUID paste)

### Step 1.6 — Brand dashboard
- [ ] Supply chain map view + TC list polish

### Step 1.7 — Supplier dashboard
- [ ] Role-aware home widgets

### Step 1.8 — Pilot testing
- [ ] Real brand + suppliers pilot
