# Phase 1.8 — Pilot Test Guide

## Goal
Prove MVP path: brand + supplier onboard → facility → wallet credit → TC issue → brand verify → map/reports.

## Prep
1. `npm run dev --workspace=web`
2. Open `http://localhost:3000`
3. Use two browser profiles (or normal + private window)
4. Full tick-list: `docs/FEATURE_TEST_LIST.md`

## Script

### A. Supplier org
1. Register user A → `/onboarding` → create **Supplier** org  
2. Copy **org id** from supplier dashboard footer  
3. `/facilities` → declare a garment factory (Tier 1)  
4. `/wallet` → credit e.g. Organic Cotton `1000` KG  
5. Confirm balance card + mass-balance strip updates  

### B. Brand org
1. Register user B (other browser) → create **Brand** org  
2. `/brand` → **Link supplier** using supplier org id (Tier 1)  
3. Confirm supplier appears + `/supply-chain` shows tier → brand map  
4. `/orders` → create PO to linked supplier  

### C. TC flow
1. As supplier → `/tc` → Issue TC  
   - Receiver = brand (picker ★)  
   - Optional: link the PO  
   - Material + Qty ≤ available  
2. Confirm TC number + wallet debit  
3. As brand → `/alerts` shows notification → Open  
4. `/tc` → **Verify** → status `verified`  
5. Open `/tc/{id}` QR + Print; `/reports` Print pack  

### D. Digital Product Passport
1. `/dpp` → create draft (name, composition, CO₂/water)  
2. Open detail → **Publish DPP**  
3. Incognito / logged-out → open `/p/{id}` (no login)  
4. Confirm QR + journey + metrics render  

### E. Shipments
1. `/shipments` → create (origin/destination ports, optional order)  
2. Open detail → log **Departed** → status `in_transit`  
3. Log **Delivered** → status `delivered`  

### F. Verification marketplace
1. Register auditor org (3rd browser / profile)  
2. As brand → `/verification` → request on linked supplier  
3. As auditor → `/auditor` → Marketplace → **Claim**  
4. Publish report (pass + score) → brand gets `/alerts`  

## Pass criteria
- [ ] Tenant isolation: each org only sees own facilities/wallet  
- [ ] Brand sees linked supplier + inbound TC + chain map  
- [ ] Over-issue (qty > balance) is rejected  
- [ ] Verify only works for receiver  
- [ ] Alerts + reports render without error  
- [ ] Published DPP public at `/p/{id}`; draft returns 404  
- [ ] Shipment events update status correctly  
- [ ] Auditor can claim open VR and complete report  
- [ ] `/risk` and `/compliance` render derived flags (not coming soon)  
- [ ] `/sustainability` shows score + priorities (not coming soon)  
- [ ] DPP material linked to TC appears on public `/p/{id}`  
- [ ] TC linked to shipment appears on `/shipments/{id}`  

## Known gaps (ok for pilot)
- Email optional: set `RESEND_API_KEY` + org `email` for outbound mail; otherwise in-app `/alerts` + invite link  
- Hyperledger Fabric network writer later (hash anchor uses `stt_mock` today)  
- Full regulations library / evidence vault later (Compliance uses derived tasks + label map)  
- Scope 1/2/3 ledgers + SBTi / framework PDF generators later (Sustainability uses DPP + ops coverage)  
- GPS/carrier shipment APIs not yet  
- Verification bidding not yet  

## Optional email check (Step 2.4)
1. Set `RESEND_API_KEY` (+ `EMAIL_FROM` if not using Resend onboarding domain)  
2. Ensure receiving org has `organizations.email`  
3. Issue TC / create invite / request verification → inbox or Alerts “Email sent”  

## Optional anchor check (Step 2.5)
1. Issue a new TC  
2. Open `/tc/{id}` → **Anchored** + sha256 + `STT-ANCHOR-…`  
3. Click **Verify integrity** → match  

## Optional risk/compliance check (Step 2.6)
1. Leave a TC unverified → `/risk` shows high flag  
2. Open `/compliance` → task + standards labels  
3. Brand home KPIs show Risk score + Compliance  

## Optional sustainability check (Step 2.7)
1. Create/publish DPP with carbon + water  
2. Open `/sustainability` → score, CO₂e/water KPIs, priorities  
3. Framework label strip visible  

## Optional DPP↔TC link check (Step 2.8)
1. Open `/dpp/{id}` → link material + TC (+ %)  
2. Publish → `/p/{id}` shows material + TC number  
3. `/tc/{id}` lists the passport under Linked product passports  

## Optional TC↔shipment check (Step 2.9)
1. Create a shipment  
2. Issue TC with that shipment selected (or link on TC detail)  
3. Confirm `/tc/{id}` badge + `/shipments/{id}` Linked TCs  

## Optional batch/unit QR check (Step 2.10)
1. Publish DPP  
2. Create Batch + Unit QR on detail  
3. Open public links with `?type=batch|unit&code=…`  

## Log results
Date: ________  
Tester: ________  
Pass / Fail: ________  
Notes: ________  
