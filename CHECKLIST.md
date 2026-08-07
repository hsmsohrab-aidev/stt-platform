# STT Platform — Execution Checklist
> Design source of truth: `docs/DESIGN_SYSTEM.md` + `docs/STT_Interactive_Prototype.html`
> Last updated: 2026-08-07
>
> **Manual QA:** `docs/FEATURE_TEST_LIST.md`

## Phase 0 — Foundation
- [x] 0.0–0.6 complete (planning, GitHub, Supabase, monorepo, design system, auth, CI)
- [x] Design system locked from interactive prototype

## Phase 1 — MVP
- [x] 1.1–1.10 complete (schema, onboarding, facilities, wallet, TC, dashboards, orders/alerts, supply-chain/reports, invites)
- [ ] Manual E2E pilot run + feedback

## Phase 2 — Core Platform

### Step 2.1 — Digital Product Passport
- [x] Tables + public RPC + `/dpp` + `/p/[id]`
- [x] Link passport materials to TC line items (`passport_materials.tc_id`)
- [x] Batch / unit QR variants (`passport_qr_codes` + `/p/{id}?type=&code=`)

### Step 2.2 — Shipment tracking
- [x] `shipments` + `shipment_events` + `/shipments` UI + timeline events
- [x] Link shipment on TC issue (`shipment_id`) + TC/shipment reverse views
- [ ] GPS / carrier API ingest (later)

### Step 2.3 — Auditor dashboard + verification marketplace
- [x] `verification_requests` + `verification_assignments` + `audit_reports` + RLS
- [x] VR number sequence (`VR-YYYY-#####`)
- [x] `/verification` — brand request / auditor claim / publish report
- [x] `/auditor` hub KPIs + open jobs + assignments
- [x] Home `/` redirects auditor → `/auditor`
- [ ] Bidding / competitive quotes (later)
- [ ] File upload for audit pack (later)

### Step 2.4 — Email (Resend)
- [x] `lib/email/resend.ts` + templates + notify helpers
- [x] TC issued → receiver org email (if `organizations.email` set)
- [x] Verification requested → supplier org email
- [x] Audit complete → brand org email
- [x] Membership invite → invitee email (or share link when key missing)
- [x] Graceful skip when `RESEND_API_KEY` unset (in-app still works)
- [ ] Production domain verify in Resend (ops)

### Step 2.5 — TC hash anchoring
- [x] `tc_blockchain_records` + RLS (`current_org_id`)
- [x] SHA-256 canonical payload + mock tx id (`stt_mock`)
- [x] Auto-anchor on TC issue → TC columns + ledger row
- [x] `/tc/[id]` Anchored badge + hash/tx + Verify integrity
- [ ] Hyperledger Fabric network writer (later)

### Perf (ongoing)
- [x] Dashboard loaders parallelized
- [x] Session profile+org embed + membership parallel
- [x] Persistent `AppShell` Sidebar in dashboard layout
- [x] Unread count `cache()`; Table as server component
- [x] `optimizePackageImports` + dynamic Issue TC form
- [ ] Production speed: deploy to Vercel (CDN / edge TLS) — local `next dev` stays slow

### Step 2.6 — Risk Hub + Compliance
- [x] `/risk` exception queue derived from TC / VR / certs / facilities / wallet
- [x] `/compliance` tasks + standards readiness (GOTS/GRS/OEKO-TEX/REACH labels)
- [x] Brand dashboard risk + compliance scores wired
- [x] Supplier dashboard compliance/overdue task counts from same snapshot
- [ ] Full regulations library + evidence vault (later)
- [ ] Persist acknowledge/snooze on `risk_flags` (later)

### Step 2.7 — Sustainability
- [x] `/sustainability` score + priorities + measured metrics (DPP / facilities / TCs)
- [x] Framework label map (GRI, CSRD, CDP, TCFD, SASB)
- [x] Brand dashboard `sustainabilityScore` wired
- [ ] Scope 1/2/3 ledgers + SBTi target wizard (later)
- [ ] Framework PDF/XBRL generators (later)

### Step 2.8 — DPP ↔ TC material linking
- [x] `/dpp/[id]` link material + optional TC (%, cert, origin)
- [x] Unlink; verified badge when TC status = verified
- [x] Public `/p/[id]` shows linked materials + TC numbers
- [x] `/tc/[id]` reverse list of linked passports
- [x] `get_public_passport` includes `materials` array

### Step 2.9 — TC ↔ Shipment linking
- [x] Issue TC form: optional shipment select
- [x] Issuer can link/unlink shipment on `/tc/[id]`
- [x] Shipment detail lists linked TCs
- [x] Validation: only org-visible shipments

### Step 2.10 — DPP batch / unit QR
- [x] Create batch/unit QR on published `/dpp/[id]`
- [x] Public `/p/[id]?type=batch|unit&code=…` badge
- [x] QR list with printable images

### Step 2.11 — Next (ops / infra)
- [ ] Deploy web to Vercel + env (see `.env.example`)
- [ ] Manual E2E pilot run + feedback
- [ ] Hyperledger Fabric writer (replace `stt_mock`) — needs Fabric network
- [ ] GPS / carrier API ingest
- [ ] Resend production domain verify
