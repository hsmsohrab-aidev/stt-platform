# Phase 1.8 — Pilot Test Guide

## Goal
Prove MVP path: brand + supplier onboard → facility → wallet credit → TC issue → brand verify.

## Prep
1. `npm run dev --workspace=web`
2. Open `http://localhost:3000`
3. Use two browser profiles (or normal + private window)

## Script

### A. Supplier org
1. Register user A → `/onboarding` → create **Supplier** org  
2. Copy **org id** from supplier dashboard footer  
3. `/facilities` → declare a garment factory (Tier 1)  
4. `/wallet` → credit e.g. Organic Cotton `1000` KG  
5. Confirm balance card updates  

### B. Brand org
1. Register user B (other browser) → create **Brand** org  
2. `/brand` → **Link supplier** using supplier org id (Tier 1)  
3. Confirm supplier appears in linked list  

### C. TC flow
1. As supplier → `/tc` → Issue TC  
   - Receiver = brand org id  
   - Material = Organic Cotton  
   - Qty = `100` (must be ≤ available)  
2. Confirm TC number `TC-YYYY-######` appears + wallet balance drops  
3. As brand → `/tc` → **Verify** on the received row  
4. Status becomes `verified`  

## Pass criteria
- [ ] Tenant isolation: each org only sees own facilities/wallet  
- [ ] Brand sees linked supplier + inbound TC  
- [ ] Over-issue (qty > balance) is rejected  
- [ ] Verify only works for receiver  

## Known gaps (ok for pilot)
- PDF / QR not generated yet  
- Org picker is UUID paste (not search UI)  
- Orders / Risk / Compliance modules not in MVP UI  

## Log results
Date: ________  
Tester: ________  
Pass / Fail: ________  
Notes: ________  
