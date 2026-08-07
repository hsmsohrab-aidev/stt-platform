# STT Platform — Execution Checklist
> Design source of truth: `docs/DESIGN_SYSTEM.md` + `docs/STT_Interactive_Prototype.html`
> Last updated: 2026-08-07

## Phase 0 — Foundation
- [x] 0.0–0.6 complete (planning, GitHub, Supabase, monorepo, design system, auth, CI)
- [x] Design system locked from interactive prototype

## Phase 1 — MVP

### Step 1.1 — Core Database Schema
- [x] Auth + facilities + materials/wallets + TC tables + RLS/triggers

### Step 1.2 — Organization Onboarding
- [x] `/onboarding` create org + owner role + wallet + middleware gate

### Step 1.3 — Facility Declaration
- [x] `/facilities` list + declare form

### Step 1.4 — Material Wallet
- [x] `/wallet` balances + credit ledger

### Step 1.5 — TC Issuance
- [x] `/tc` issue with balance check + auto TC number
- [ ] PDF + QR polish
- [ ] Receiver org picker UI (UUID paste for now)

### Step 1.6 — Brand dashboard
- [x] Role-aware home for `brand`
- [x] `/brand` hub — suppliers + received TCs + link supplier
- [x] KPI strip (prototype style)

### Step 1.7 — Supplier dashboard
- [x] Role-aware home for `supplier`
- [x] `/supplier` hub — wallet cards + facilities + issued TCs + shortcuts
- [x] Org id shown for brand linking / TC receive

### Step 1.8 — Pilot testing
- [ ] Two orgs (brand + supplier) end-to-end: link → credit → TC → verify
- [ ] Collect feedback / fix critical bugs
