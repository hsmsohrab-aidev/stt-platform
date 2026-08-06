# STT Platform — Master Project Plan
> **Smart Traceability Technology** | Supply Chain Intelligence & Digital Product Passport Platform
> Powered by SGC Global Assurance

---

## Document Info

| Field | Detail |
|---|---|
| **Version** | 0.1 — Initial Draft |
| **Created** | 2026-08-06 |
| **Last Updated** | 2026-08-06 |
| **Status** | 🟡 Planning Phase |
| **Owner** | STT / SGC Global Assurance |

> **এই document কীভাবে ব্যবহার করবে:**
> প্রতিটি step শেষ হলে সেই section-এ status update করো। যা হয়েছে ✅, যা চলছে 🔄, যা বাকি ⬜, যেখানে সমস্যা 🔴। এই file-ই হবে project-এর single source of truth।

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Vision & Goals](#2-vision--goals)
3. [Stakeholders & User Roles](#3-stakeholders--user-roles)
4. [Tech Stack — Final Decision](#4-tech-stack--final-decision)
5. [System Architecture](#5-system-architecture)
6. [Database — Table List](#6-database--table-list)
7. [Feature Modules](#7-feature-modules)
8. [Dashboard List](#8-dashboard-list)
9. [MVP Scope — Phase 1](#9-mvp-scope--phase-1)
10. [Full Roadmap](#10-full-roadmap)
11. [Security Plan](#11-security-plan)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Team & AI Workflow](#13-team--ai-workflow)
14. [Step-by-Step Execution Log](#14-step-by-step-execution-log)
15. [Decisions Log](#15-decisions-log)
16. [Open Questions](#16-open-questions)

---

## 1. Project Overview

**STT (Smart Traceability Technology)** হলো একটি multi-stakeholder SaaS platform যেখানে textile, apparel এবং footwear supply chain-এর প্রতিটি tier map করা হয় — raw material থেকে consumer পর্যন্ত।

এটা শুধু tracking tool না। এটা একটা **compliance + verification + sustainability intelligence ecosystem** যেখানে:

- Brand জানতে পারে তার cotton কোন খামার থেকে এসেছে
- Supplier digital TC issue করতে পারে blockchain-এ
- Auditor verified report upload করতে পারে
- Consumer QR scan করে product-এর পুরো যাত্রা দেখতে পারে
- Regulator compliance data verify করতে পারে

**এক কথায়:** One Platform. Complete Transparency. From Source to Consumer.

---

## 2. Vision & Goals

### Vision
> বিশ্বের textile ও apparel supply chain-কে সম্পূর্ণ transparent, traceable এবং compliant করা।

### Business Goals
- [ ] ২০২৫ সালের মধ্যে ৫০০+ factories onboard করা
- [ ] EU DPP (2026), CSRD (2024), CSDDD (2027) compliance ready করা
- [ ] Transaction Certificate marketplace চালু করা
- [ ] ১০০+ global brands-এর trusted platform হওয়া

### Product Goals
- [ ] Supplier onboarding time ৭ দিনের মধ্যে রাখা
- [ ] 99.9% platform uptime
- [ ] Blockchain-anchored, tamper-proof data
- [ ] Mobile-first field operations

---

## 3. Stakeholders & User Roles

মোট **৭ ধরনের user** — প্রতিটির আলাদা dashboard, আলাদা permission।

| # | Role | কারা | মূল কাজ |
|---|---|---|---|
| 1 | **Brand / Buyer** | H&M, Zara, Nike level brands | Supply chain দেখা, order track করা, DPP manage করা |
| 2 | **Supplier / Manufacturer** | Garment factory, spinning mill, fabric supplier | Material wallet, TC issue করা, facility declare করা |
| 3 | **Auditor / Certifier** | Independent auditors, certification bodies | Verification করা, audit report upload করা |
| 4 | **Logistics Provider** | 3PL, freight forwarders, transporters | Shipment update করা, movement data share করা |
| 5 | **Regulator** | Government bodies, EU regulators | Compliance data দেখা, policy enforcement |
| 6 | **Financial Institution** | Banks, insurers, fintech | ESG-linked financing, supplier creditworthiness |
| 7 | **Consumer** | End customer | QR scan করে product story দেখা (no login) |

### Permission Matrix (High Level)

| Feature | Brand | Supplier | Auditor | Logistics | Regulator | Financial | Consumer |
|---|---|---|---|---|---|---|---|
| Supply chain map | ✅ Full | ✅ Own | ✅ Assigned | ❌ | ✅ Read | ✅ Read | ❌ |
| Material wallet | ❌ | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| TC issuance | ❌ | ✅ Full | ✅ Verify | ❌ | ✅ Read | ✅ Read | ❌ |
| DPP / QR | ✅ Manage | ✅ View | ✅ View | ❌ | ✅ Read | ❌ | ✅ Public |
| Risk Hub | ✅ Full | ✅ Own | ❌ | ❌ | ✅ Full | ✅ Read | ❌ |
| Compliance | ✅ Full | ✅ Own | ✅ Assigned | ❌ | ✅ Full | ❌ | ❌ |
| Sustainability | ✅ Full | ✅ Own | ❌ | ❌ | ✅ Read | ✅ Read | ❌ |

---

## 4. Tech Stack — Final Decision

> **সিদ্ধান্ত তারিখ:** 2026-08-06
> **Laravel বাদ দেওয়া হয়েছে** — কারণ: real-time features, microservice scalability, এবং blockchain ecosystem-এর সাথে mismatch।

### Core Stack

| Layer | Technology | কেন |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) + TypeScript | SSR/SSG, server actions, same language as backend |
| **UI** | Tailwind CSS + shadcn/ui | Rapid development, accessible components |
| **Backend API** | NestJS (Node.js + TypeScript) | Microservice-ready, decorator-based, type-safe |
| **Database** | Supabase (PostgreSQL) | Built-in auth, RLS, realtime, storage — একসাথে |
| **Auth** | Supabase Auth | MFA, OAuth, magic link built-in |
| **Realtime** | Supabase Realtime + Socket.io | Live order tracking, alerts |
| **Cache** | Upstash Redis | Serverless, Supabase-compatible |
| **File Storage** | Supabase Storage | TC documents, audit reports, product images |
| **Background Jobs** | Trigger.dev | Async workflows, scheduled tasks |
| **ML / AI Service** | Python + FastAPI | আলাদা container, AI/ML ecosystem |
| **Blockchain** | Hyperledger Fabric + Node.js SDK | Private chain, TC immutability |
| **Search** | Supabase Full-text search (শুরুতে) → Elasticsearch (পরে) | |
| **Monorepo** | Turborepo | Frontend + backend + shared types একসাথে |
| **Deployment** | Vercel (Next.js) + Railway (NestJS) + Supabase Cloud | |
| **CI/CD** | GitHub Actions | Automated test + deploy |
| **Monitoring** | Sentry (errors) + Vercel Analytics | |

### MVP-তে বাদ থাকবে (পরে যোগ হবে)
- Hyperledger Fabric (Phase 2 তে)
- Python ML Service (Phase 3 তে)
- Elasticsearch (scale হলে)
- IoT integration

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  Next.js Web App  │  Mobile App (React Native — পরে)        │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             ▼                            ▼
┌─────────────────────┐      ┌────────────────────────┐
│   Supabase Auth     │      │   Next.js API Routes   │
│   (JWT + MFA)       │      │   (Server Actions)     │
└─────────────────────┘      └───────────┬────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │    NestJS API        │
                              │  (Core Business      │
                              │    Logic)            │
                              └──────┬───────────────┘
                    ┌────────────────┼─────────────────┐
                    ▼                ▼                  ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │  Supabase    │  │  Blockchain  │  │  ML Service  │
         │  PostgreSQL  │  │  Service     │  │  (FastAPI)   │
         │  + Storage   │  │  (Hyperledger│  │              │
         │  + Realtime  │  │   Fabric)    │  │              │
         └──────────────┘  └──────────────┘  └──────────────┘
                    │
         ┌──────────▼──────────┐
         │   Upstash Redis     │
         │   (Cache + Queue)   │
         └─────────────────────┘
```

### Data Flow (TC Issuance Example)
```
Supplier submits material transfer
→ NestJS validates data
→ Mass balance updated in PostgreSQL
→ TC generated with unique ID
→ TC hashed + anchored to Hyperledger Fabric
→ TC PDF stored in Supabase Storage
→ Brand notified via Supabase Realtime
→ TC QR code generated for consumer
```

---

## 6. Database — Table List

**Database:** Supabase (PostgreSQL)
**Total estimated tables:** ~65

### Group A: Organizations & Users (~10 tables)
| Table | Description | Status |
|---|---|---|
| `organizations` | Companies on platform (brands, suppliers, etc.) | ⬜ |
| `organization_members` | User-organization relationship | ⬜ |
| `profiles` | Extended user profile | ⬜ |
| `roles` | System roles (brand_admin, supplier_user, etc.) | ⬜ |
| `permissions` | Granular permissions | ⬜ |
| `role_permissions` | Role-permission mapping | ⬜ |
| `invitations` | Pending org invitations | ⬜ |
| `api_keys` | Organization API keys | ⬜ |
| `audit_logs` | Every action logged | ⬜ |
| `sessions` | Active sessions tracking | ⬜ |

### Group B: Supply Chain Mapping (~8 tables)
| Table | Description | Status |
|---|---|---|
| `facilities` | Factory, mill, unit locations | ⬜ |
| `facility_declarations` | Declared upstream/downstream | ⬜ |
| `supplier_relationships` | Who supplies whom | ⬜ |
| `supply_chain_tiers` | Tier 1→6 mapping per brand | ⬜ |
| `subcontractors` | Declared subcontractors | ⬜ |
| `facility_certifications` | ISO, GOTS, etc. certs | ⬜ |
| `supply_chain_maps` | Full chain snapshots | ⬜ |
| `unauthorized_flags` | AI-detected anomalies | ⬜ |

### Group C: Order Management (~8 tables)
| Table | Description | Status |
|---|---|---|
| `orders` | Master order records | ⬜ |
| `order_items` | Line items per order | ⬜ |
| `order_milestones` | Production milestones | ⬜ |
| `order_allocations` | Multi-factory allocation | ⬜ |
| `shipments` | Shipment records | ⬜ |
| `shipment_events` | Real-time movement events | ⬜ |
| `exceptions` | Delays, deviations, alerts | ⬜ |
| `logistics_documents` | Bill of lading, etc. | ⬜ |

### Group D: Material Wallet & Mass Balance (~7 tables)
| Table | Description | Status |
|---|---|---|
| `materials` | Material master (cotton, polyester, etc.) | ⬜ |
| `material_wallets` | Per-organization wallet | ⬜ |
| `wallet_balances` | Current balance per material type | ⬜ |
| `material_transactions` | Debit/credit transactions | ⬜ |
| `mass_balance_records` | Mass balance calculations | ⬜ |
| `material_requirements` | AI-calculated requirements per order | ⬜ |
| `material_gaps` | Shortfall alerts | ⬜ |

### Group E: Transaction Certificates (~6 tables)
| Table | Description | Status |
|---|---|---|
| `transaction_certificates` | TC master records | ⬜ |
| `tc_line_items` | Materials in each TC | ⬜ |
| `tc_verifications` | Verification status | ⬜ |
| `tc_blockchain_records` | Blockchain hash + tx ID | ⬜ |
| `tc_documents` | PDF storage references | ⬜ |
| `tc_transfers` | TC transfer history | ⬜ |

### Group F: Digital Product Passport (~6 tables)
| Table | Description | Status |
|---|---|---|
| `product_passports` | DPP master records | ⬜ |
| `passport_materials` | Materials in each product | ⬜ |
| `passport_supply_chain` | Supply chain snapshot in DPP | ⬜ |
| `passport_sustainability` | Sustainability data in DPP | ⬜ |
| `passport_qr_codes` | QR code records | ⬜ |
| `passport_scans` | Consumer scan analytics | ⬜ |

### Group G: Compliance & Regulations (~8 tables)
| Table | Description | Status |
|---|---|---|
| `regulations` | DPP, CSRD, CSDDD, EUDR, REACH, etc. | ⬜ |
| `regulation_requirements` | Specific requirements per regulation | ⬜ |
| `compliance_controls` | Internal controls | ⬜ |
| `compliance_tasks` | Actionable tasks | ⬜ |
| `evidence_files` | Supporting documents | ⬜ |
| `compliance_assessments` | Periodic assessments | ⬜ |
| `compliance_incidents` | Violations, gaps | ⬜ |
| `compliance_reports` | Generated reports | ⬜ |

### Group H: Risk Hub (~6 tables)
| Table | Description | Status |
|---|---|---|
| `risk_entities` | Suppliers, facilities being monitored | ⬜ |
| `risk_scores` | Calculated risk scores | ⬜ |
| `risk_alerts` | Active alerts | ⬜ |
| `risk_categories` | Financial, ESG, operational, etc. | ⬜ |
| `risk_mitigations` | Action plans | ⬜ |
| `risk_history` | Historical risk trend | ⬜ |

### Group I: Sustainability & ESG (~8 tables)
| Table | Description | Status |
|---|---|---|
| `sustainability_goals` | Science-based targets | ⬜ |
| `emissions_data` | Scope 1, 2, 3 data | ⬜ |
| `energy_data` | Energy consumption | ⬜ |
| `water_data` | Water usage | ⬜ |
| `waste_data` | Waste diversion | ⬜ |
| `social_data` | Labor, human rights metrics | ⬜ |
| `supplier_sustainability_scores` | Per-supplier ESG score | ⬜ |
| `sustainability_reports` | GRI, SASB, TCFD reports | ⬜ |

### Group J: Verification Marketplace (~5 tables)
| Table | Description | Status |
|---|---|---|
| `verification_requests` | Buyer-raised requests | ⬜ |
| `verification_assignments` | Auditor assignments | ⬜ |
| `audit_reports` | Completed audit reports | ⬜ |
| `auditor_profiles` | Auditor credentials, expertise | ⬜ |
| `verification_pricing` | Competitive bidding records | ⬜ |

### Group K: Notifications & Alerts (~3 tables)
| Table | Description | Status |
|---|---|---|
| `alert_rules` | Custom alert configurations | ⬜ |
| `notifications` | All notifications sent | ⬜ |
| `notification_preferences` | Per-user preferences | ⬜ |

---

## 7. Feature Modules

### Module 1: Supply Chain Declaration Engine
**কী করে:** প্রতিটি supplier তার সব upstream/downstream facility declare করে। Unauthorized subcontracting AI দিয়ে detect হয়।

**Key features:**
- [ ] Tier 1→6 facility mapping
- [ ] Mandatory source factory declaration
- [ ] Unauthorized subcontracting detection (AI)
- [ ] Facility verification workflow
- [ ] Supply chain visualization (tree view)

**Dependencies:** Organizations, Facilities tables
**Phase:** 1 (MVP)

---

### Module 2: Material Wallet & Mass Balance
**কী করে:** প্রতিটি supplier-এর কাছে কতটুকু certified material আছে সেটা wallet-এ track করা হয়। Material transfer হলে balance কমে, receive হলে বাড়ে।

**Key features:**
- [ ] Cotton / Polyester / Recycled fiber wallet
- [ ] Material transfer transactions
- [ ] Mass balance calculation engine
- [ ] Material gap alert
- [ ] AI-powered material requirement forecasting

**Dependencies:** Materials, Orders tables
**Phase:** 1 (MVP)

---

### Module 3: Transaction Certificate (TC) System
**কী করে:** Material transfer-এর সাথে blockchain-anchored TC issue হয়। TC tamper-proof, QR-verifiable।

**Key features:**
- [ ] TC issuance workflow
- [ ] Blockchain anchoring (Phase 2 তে)
- [ ] TC PDF generation
- [ ] QR code per TC
- [ ] TC transfer history
- [ ] Buyer verification portal

**Dependencies:** Material Wallet, Blockchain service
**Phase:** 1 (TC without blockchain), 2 (with blockchain)

---

### Module 4: Digital Product Passport (DPP)
**কী করে:** প্রতিটি product-এর জন্য EU-compliant digital passport তৈরি হয়। QR scan করলে consumer পুরো supply chain দেখতে পায়।

**Key features:**
- [ ] DPP generation per product/batch
- [ ] QR code creation
- [ ] Public consumer-facing view
- [ ] EU DPP Regulation 2024/1781 compliance
- [ ] Sustainability data embedded
- [ ] Scan analytics

**Dependencies:** TC System, Supply Chain Map, Sustainability data
**Phase:** 2

---

### Module 5: Order Intelligence
**কী করে:** Real-time order tracking across tiers। Milestone tracking, exception alerts, live ETA।

**Key features:**
- [ ] Order creation + validation
- [ ] Multi-factory allocation
- [ ] Milestone tracking
- [ ] Exception alerts
- [ ] Live shipment tracking
- [ ] Delivery performance analytics

**Dependencies:** Orders, Shipments, Logistics tables
**Phase:** 2

---

### Module 6: Compliance Command Center
**কী করে:** Global regulations track করা, compliance tasks automate করা, evidence manage করা, audit-ready reports generate করা।

**Key features:**
- [ ] Regulation library (DPP, CSRD, CSDDD, EUDR, REACH + 50 more)
- [ ] Per-organization compliance mapping
- [ ] Task automation + reminders
- [ ] Evidence file management
- [ ] Gap analysis dashboard
- [ ] Audit-ready report generation

**Dependencies:** Regulations, Evidence, Compliance tables
**Phase:** 3

---

### Module 7: Risk Hub
**কী করে:** Supply chain-এর সব risk real-time monitor করা। AI দিয়ে risk score predict করা, proactive alerts দেওয়া।

**Key features:**
- [ ] Multi-dimensional risk monitoring (financial, ESG, operational, compliance, cyber)
- [ ] AI risk scoring engine
- [ ] Real-time alerts + escalations
- [ ] Root cause drill-down
- [ ] Mitigation action tracking
- [ ] Risk trend reporting

**Dependencies:** All modules (aggregated data)
**Phase:** 3

---

### Module 8: Sustainability Intelligence
**কী করে:** Supply chain জুড়ে environmental ও social performance track করা। ESG data collect, verify, report করা।

**Key features:**
- [ ] Scope 1, 2, 3 emissions tracking
- [ ] Supplier ESG data collection
- [ ] Goal setting + progress tracking
- [ ] GRI / SASB / TCFD / CSRD reporting
- [ ] Supplier sustainability scoring
- [ ] Verified claims management

**Dependencies:** Supplier data, ESG tables
**Phase:** 4

---

### Module 9: Verification Marketplace
**কী করে:** Buyer verification request করে, qualified auditor apply করে, on-site verification হয়, report platform-এ upload হয়।

**Key features:**
- [ ] Verification request creation
- [ ] Auditor network + matching
- [ ] Competitive bidding
- [ ] Digital audit report upload
- [ ] Verified status broadcasting
- [ ] Integration with TC + DPP

**Dependencies:** Auditor profiles, Verification tables
**Phase:** 4

---

### Module 10: Reports & Analytics
**কী করে:** সব data থেকে actionable insights। Custom reports, scheduled delivery, export।

**Key features:**
- [ ] Role-based dashboards
- [ ] Custom report builder
- [ ] Scheduled automated reports
- [ ] Export (PDF, Excel, CSV, PowerPoint)
- [ ] KPI tracking
- [ ] Predictive analytics (AI)

**Dependencies:** All modules
**Phase:** Ongoing (basic in Phase 1, advanced in Phase 4)

---

## 8. Dashboard List

### Dashboard 1: Brand / Buyer Dashboard
**Users:** Brand CPO, Sustainability Manager, Sourcing Director
**Key views:**
- [ ] Supply chain map (tier visualization)
- [ ] Order overview + exception alerts
- [ ] Risk score summary
- [ ] Compliance status per regulation
- [ ] ESG metrics + sustainability score
- [ ] Supplier performance ranking
- [ ] DPP management
- [ ] Verification marketplace access

---

### Dashboard 2: Supplier / Manufacturer Dashboard
**Users:** Factory compliance officer, production manager
**Key views:**
- [ ] Incoming orders + production milestones
- [ ] Material wallet (balance per material)
- [ ] TC issuance workflow
- [ ] Mass balance status
- [ ] Facility declaration management
- [ ] Compliance task list
- [ ] Sustainability data input

---

### Dashboard 3: Auditor / Certifier Dashboard
**Users:** Field auditors, certification body staff
**Key views:**
- [ ] Assigned verification requests
- [ ] Audit schedule
- [ ] Report upload + digital signing
- [ ] Certificate management
- [ ] Evidence document review
- [ ] Completed audit history

---

### Dashboard 4: Logistics Provider Dashboard
**Users:** 3PL operations team, drivers
**Key views:**
- [ ] Active shipments map
- [ ] Milestone update interface
- [ ] Document upload (Bill of Lading, etc.)
- [ ] Delivery performance metrics

---

### Dashboard 5: Regulator Dashboard
**Users:** Government compliance officers
**Key views:** *(Read-only + enforcement)*
- [ ] Platform-wide compliance overview
- [ ] Organization audit trails
- [ ] Policy violation alerts
- [ ] Aggregated sustainability reporting
- [ ] Enforcement action log

---

### Dashboard 6: Financial Institution Dashboard
**Users:** ESG analysts, credit officers
**Key views:**
- [ ] Supplier ESG scores + trend
- [ ] Verified transaction history
- [ ] Supply chain risk exposure
- [ ] ESG-linked financing eligibility

---

### Dashboard 7: Consumer / Public View
**Users:** End consumers (no login required)
**Key views:**
- [ ] QR scan → product story
- [ ] Origin map (raw material → store)
- [ ] Material composition
- [ ] Sustainability claims + verification badges
- [ ] Brand transparency score

---

## 9. MVP Scope — Phase 1

> **লক্ষ্য:** ন্যূনতম এই features নিয়ে একটা real brand এবং ৫টা real supplier দিয়ে pilot চালানো।

### Phase 1-এ থাকবে ✅
- [ ] Organization onboarding (brand + supplier)
- [ ] Multi-tenant auth (Supabase Auth + RLS)
- [ ] Facility declaration (tier 1, 2, 3)
- [ ] Supply chain map (basic tree view)
- [ ] Material wallet (cotton + polyester)
- [ ] Material transactions (debit/credit)
- [ ] TC issuance (without blockchain — DB only)
- [ ] TC PDF generation + QR code
- [ ] Basic brand dashboard (supply chain view + TC list)
- [ ] Basic supplier dashboard (wallet + TC)
- [ ] Email notifications (Resend)
- [ ] Basic reports (PDF export)

### Phase 1-এ থাকবে না ❌
- Blockchain anchoring
- DPP / Consumer QR
- Compliance Command Center
- Risk Hub
- Sustainability Intelligence
- Verification Marketplace
- Mobile app
- ML/AI features
- Logistics dashboard
- Regulator dashboard

### Phase 1 Success Criteria
- [ ] একটি brand তার ৩-tier supply chain map করতে পেরেছে
- [ ] একটি supplier material wallet থেকে TC issue করতে পেরেছে
- [ ] Brand সেই TC verify করতে পেরেছে
- [ ] কোনো data leak নেই (tenant isolation confirmed)
- [ ] Onboarding time < ৭ দিন

---

## 10. Full Roadmap

```
PHASE 0 — Foundation (4 weeks)
├── Monorepo setup (Turborepo)
├── Supabase project creation
├── Database schema design (core 5 tables)
├── Auth system (multi-tenant RLS)
├── CI/CD pipeline (GitHub Actions)
├── Development environment docs
└── Design system setup (shadcn/ui + Tailwind)

PHASE 1 — MVP (12 weeks)
├── Organization & user management
├── Supply chain declaration (tier 1-3)
├── Material wallet + mass balance
├── TC issuance (DB only, no blockchain)
├── Brand dashboard (basic)
├── Supplier dashboard (basic)
├── Email notifications
├── Basic PDF reports
└── Pilot with 1 brand + 5 suppliers

PHASE 2 — Core Platform (10 weeks)
├── Blockchain integration (Hyperledger Fabric)
├── TC blockchain anchoring
├── Digital Product Passport (DPP)
├── Consumer QR view
├── Order Intelligence module
├── Shipment tracking
├── Advanced supply chain visualization
└── Auditor dashboard (basic)

PHASE 3 — Intelligence Layer (8 weeks)
├── Compliance Command Center
├── Regulation library (DPP, CSRD, CSDDD, EUDR, REACH)
├── Risk Hub
├── AI risk scoring (Python FastAPI)
├── Real-time alerts system
└── Logistics dashboard

PHASE 4 — Sustainability & Marketplace (8 weeks)
├── Sustainability Intelligence
├── ESG data collection
├── GRI / SASB / TCFD reporting
├── Verification Marketplace
├── Auditor network + bidding
├── Regulator dashboard
└── Financial institution dashboard

PHASE 5 — Scale & Advanced (Ongoing)
├── Mobile app (React Native)
├── IoT integration
├── Advanced ML features
├── Multi-language support (Bengali, Chinese, Vietnamese, Turkish)
├── SAP / Oracle NetSuite / Microsoft Dynamics integration
├── Elasticsearch
└── Self-hosted Supabase option
```

---

## 11. Security Plan

### Authentication
- [ ] Supabase Auth with MFA (mandatory for admin roles)
- [ ] JWT + refresh token rotation
- [ ] Session timeout (8 hours for regular, 1 hour for auditor/admin)
- [ ] OAuth 2.0 (Google, Microsoft)
- [ ] SSO ready (SAML 2.0)

### Multi-tenant Data Isolation
- [ ] Row Level Security (RLS) on every table
- [ ] `organization_id` on every record
- [ ] Service role key শুধু backend-এ, client-এ না
- [ ] Separate Supabase storage buckets per organization
- [ ] Regular tenant isolation testing

### API Security
- [ ] Rate limiting (per IP + per API key)
- [ ] Input validation (Zod schema)
- [ ] OWASP Top 10 checklist
- [ ] SQL injection — Supabase parameterized queries
- [ ] CORS strict configuration
- [ ] API versioning (/v1/, /v2/)

### Data Security
- [ ] AES-256 encryption at rest (Supabase default)
- [ ] TLS 1.3 in transit
- [ ] GDPR compliant data handling
- [ ] Data residency (EU client data → EU region)
- [ ] Right to deletion workflow
- [ ] Backup policy (daily automated, 30-day retention)

### Blockchain
- [ ] Immutable TC records on Hyperledger Fabric
- [ ] Cryptographic hash per document
- [ ] Tamper-evident audit trail
- [ ] Private permissioned network

### Compliance
- [ ] ISO 27001 roadmap
- [ ] GDPR compliance
- [ ] Penetration testing (quarterly)
- [ ] Vulnerability assessment (monthly)
- [ ] Security incident response plan

---

## 12. Risks & Mitigations

| # | Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|---|
| 1 | **Supplier adoption failure** — suppliers এই platform use করবে না | 🔴 Critical | High | Mobile-first UI, offline support, multilingual, white-glove onboarding |
| 2 | **Data quality** — suppliers false data দেবে | 🔴 Critical | Medium | Physical verification + AI cross-check + blockchain immutability |
| 3 | **Tenant data leak** — একজনের data আরেকজন দেখতে পাবে | 🔴 Critical | Low | RLS on every table, automated tenant isolation tests |
| 4 | **Regulatory changes** — DPP/CSRD rules বদলে যাবে | 🟠 High | High | Flexible regulation engine, not hardcoded rules |
| 5 | **AI hallucination in compliance** — AI ভুল compliance decision দেবে | 🟠 High | Medium | Human-in-the-loop mandatory, AI only suggests, human approves |
| 6 | **Blockchain scalability** — high volume TC-তে latency বাড়বে | 🟠 High | Medium | Hyperledger Fabric private chain, async anchoring |
| 7 | **No one understands the full codebase** — AI-generated code বোঝা কঠিন | 🟠 High | High | Mandatory documentation per module, ADR log, expert audit |
| 8 | **Integration brittleness** — SAP/Oracle connection break হবে | 🟡 Medium | Medium | Circuit breaker pattern, fallback, retry logic |
| 9 | **Context window limits of AI** — AI cross-module consistency রাখতে পারবে না | 🟡 Medium | High | One module at a time, shared TypeScript types, integration tests |
| 10 | **Cost overrun** — Supabase/Vercel cost বেড়ে যাবে | 🟡 Medium | Medium | Cost monitoring from day 1, usage alerts set |

---

## 13. Team & AI Workflow

### Team Structure
| Role | Who | Responsibility |
|---|---|---|
| **Product Owner** | Human (তুমি) | Requirement definition, priority, pilot client management, AI orchestration |
| **AI Pair Programmer** | Cursor + Claude | Code generation, debugging, architecture decisions |
| **Expert Auditor** | External (Phase end) | Security audit, blockchain review, compliance check |

### AI Workflow Rules

**Cursor-এ কাজ করার নিয়ম:**
1. একবারে একটি module-এর বেশি কাজ না করা
2. প্রতিটি feature-এর আগে এই document-এ সেই section review করা
3. প্রতিটি module শেষে AI দিয়েই documentation generate করা
4. Integration test লেখা প্রতিটি module-এর পরে

**Claude-কে ব্যবহারের নিয়ম:**
1. Architecture decision → Claude-এ জিজ্ঞেস করো
2. Bug debug → Cursor-এ করো
3. Business logic ambiguity → Claude-এ clear করো
4. Code review → Claude দিয়ে করাও প্রতি sprint-এ

**কোনো কিছু "বোঝা না গেলে" নিয়ম:**
- Build করার আগে explain করাও (Claude/Cursor)
- Explain করতে না পারলে build করো না
- যা build হয়েছে সেটার explanation document-এ লিখে রাখো

### Architecture Decision Records (ADR)
প্রতিটি বড় সিদ্ধান্ত এই section-এ log করা হবে (দেখো Section 15)।

---

## 14. Step-by-Step Execution Log

> এই section-ই সবচেয়ে গুরুত্বপূর্ণ। প্রতিটি step শেষ হলে এখানে update করো।

---

### ✅ COMPLETED STEPS

**Step 0.0 — Project Planning** ✅
- Completed: 2026-08-06
- Notes: PROJECT_PLAN, schema, types, Cursor rules ready; pushed to GitHub

**Step 0.1 — GitHub Repository Setup** ✅ (core)
- Completed: 2026-08-06
- Notes: Repo `hsmsohrab-aidev/stt-platform`, `main` pushed. CODEOWNERS + branch protection optional later.

**Step 0.2 — Supabase Project Setup** ✅ (core)
- Completed: 2026-08-06
- Notes: Project `vekrunjeyrvkhkwsxbxm`, project-scoped MCP, `.env.local` (gitignored). Schema apply + GitHub Secrets still pending.

---

### 🔄 CURRENT STEP

**Step 0.5 — Auth System (Multi-tenant)**
- Status: 🔄 In Progress
- Started: 2026-08-06

---

### ⬜ UPCOMING STEPS

#### PHASE 0: Foundation

**Step 0.3 — Monorepo Structure তৈরি**
- Status: ✅ Completed (2026-08-06)
- Notes: Turborepo workspaces, apps/web + apps/api, packages/types|database|ui

**Step 0.4 — Design System Setup**
- Status: ✅ Completed (2026-08-06)
- Notes: shadcn/ui + Tailwind v4, brand navy/green, Button/Card/Input/Badge/Table, Sidebar/Header/PageWrapper

**Step 0.5 — Auth System (Multi-tenant)**
- Status: 🔄 In Progress
- What to do: Turborepo-তে এই structure তৈরি করো:
  ```
  stt-platform/
  ├── apps/
  │   ├── web/          # Next.js frontend
  │   └── api/          # NestJS backend
  ├── packages/
  │   ├── database/     # Supabase types + migrations
  │   ├── ui/           # Shared UI components
  │   └── types/        # Shared TypeScript types
  ├── PROJECT_PLAN.md
  ├── turbo.json
  └── package.json
  ```
- Completed when: `npm run dev` করলে frontend + backend দুটোই চলে
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 0.4 — Design System Setup**
- Status: ⬜ Not started
- What to do:
  1. shadcn/ui install করো Next.js-এ
  2. STT brand colors define করো (dark navy `#0A1628`, green `#00A651`)
  3. Base components তৈরি করো: Button, Card, Input, Badge, Table
  4. Layout components: Sidebar, Header, PageWrapper
  5. Storybook setup (optional, পরেও করা যাবে)
- Completed when: Brand colors + 5 base components ready
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 0.5 — Auth System (Multi-tenant)**
- Status: ⬜ Not started
- What to do:
  1. Supabase Auth configure করো
  2. Email + password login
  3. Magic link login
  4. `organizations` table তৈরি করো
  5. `profiles` table তৈরি করো (Supabase auth.users extend করা)
  6. RLS policies লেখো: user শুধু নিজের org-এর data দেখতে পারবে
  7. Middleware: login না থাকলে redirect করবে
  8. Role check: `brand_admin`, `supplier_user`, etc.
- Completed when: একজন user login করতে পারছে এবং শুধু নিজের org-এর data দেখছে
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 0.6 — CI/CD Pipeline**
- Status: ⬜ Not started
- What to do:
  1. GitHub Actions workflow তৈরি করো
  2. Push হলে: lint → type check → test → build
  3. Main branch merge হলে: auto deploy to Vercel (frontend) + Railway (backend)
  4. Supabase migrations auto-run করবে CI-তে
- Completed when: Push করলে automatic deploy হচ্ছে
- Notes: *(এখানে যা করলে লিখবে)*

---

#### PHASE 1: MVP

**Step 1.1 — Core Database Schema**
- Status: ⬜ Not started
- What to do: এই ৫টি table আগে তৈরি করো:
  1. `organizations`
  2. `profiles`
  3. `facilities`
  4. `materials`
  5. `material_wallets`
- RLS policy প্রতিটিতে
- Supabase migrations দিয়ে (SQL files)
- TypeScript types generate করো (`supabase gen types`)
- Completed when: 5 tables created, RLS tested, types generated
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 1.2 — Organization Onboarding Flow**
- Status: ⬜ Not started
- What to do:
  1. Registration page (brand অথবা supplier select করবে)
  2. Organization profile setup
  3. First user = org admin automatically
  4. Invite team members flow
  5. Onboarding checklist (what to do next)
- Completed when: একটা brand এবং একটা supplier register করতে পারছে
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 1.3 — Facility Declaration Module**
- Status: ⬜ Not started
- What to do:
  1. Facility add form (name, type, location, tier)
  2. Tier selection (Tier 1 = garment factory, Tier 2 = fabric, etc.)
  3. Upstream supplier link করার interface
  4. Basic supply chain tree view
  5. Facility list + status
- Completed when: একটা supplier তার tier 1, 2, 3 facility declare করতে পেরেছে
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 1.4 — Material Wallet**
- Status: ⬜ Not started
- What to do:
  1. Wallet dashboard (balance per material)
  2. Material receive transaction (credit)
  3. Material transfer transaction (debit)
  4. Mass balance calculation
  5. Transaction history
  6. Low balance alert
- Completed when: Cotton balance কমে-বাড়ে correctly, mass balance accurate
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 1.5 — TC Issuance (Without Blockchain)**
- Status: ⬜ Not started
- What to do:
  1. TC creation form
  2. Auto TC number generation (TC-2024-XXXXX)
  3. Material line items add করা
  4. TC PDF generation (React PDF বা Puppeteer)
  5. QR code generation (link to TC detail page)
  6. TC status workflow (draft → issued → verified)
  7. Email notification to buyer
- Completed when: Supplier TC issue করতে পারছে, buyer email পাচ্ছে, QR কাজ করছে
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 1.6 — Brand Dashboard (Basic)**
- Status: ⬜ Not started
- What to do:
  1. Supply chain map view (connected suppliers)
  2. TC list (received TCs)
  3. TC verification page
  4. Basic stats (total suppliers, total TCs, compliance %)
- Completed when: Brand তার suppliers দেখতে পারছে, TC verify করতে পারছে
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 1.7 — Supplier Dashboard (Basic)**
- Status: ⬜ Not started
- What to do:
  1. Material wallet overview
  2. TC issuance shortcut
  3. Facility status
  4. Compliance task reminders (basic)
- Completed when: Supplier dashboard fully functional
- Notes: *(এখানে যা করলে লিখবে)*

---

**Step 1.8 — Pilot Testing**
- Status: ⬜ Not started
- What to do:
  1. ১টি brand onboard করো
  2. ৫টি supplier onboard করো (brand-এর actual suppliers)
  3. Real TC issue করো
  4. Feedback collect করো
  5. Critical bugs fix করো
- Completed when: Pilot successfully completed, feedback documented
- Notes: *(এখানে যা করলে লিখবে)*

---

*(Phase 2, 3, 4, 5 steps — Phase 1 শেষ হলে detail করা হবে)*

---

## 15. Decisions Log

> প্রতিটি বড় সিদ্ধান্ত এখানে log করো — কেন নেওয়া হলো, alternatives কী ছিল।

| Date | Decision | Why | Alternatives Considered |
|---|---|---|---|
| 2026-08-06 | **Laravel বাদ দেওয়া হয়েছে** | Real-time features, microservice scalability, blockchain ecosystem mismatch | Laravel + Livewire (rejected) |
| 2026-08-06 | **NestJS select করা হয়েছে** | TypeScript, microservice-ready, same language as frontend | Express.js (too minimal), FastAPI (Python — ML-only রাখা হবে) |
| 2026-08-06 | **Supabase select করা হয়েছে** | Built-in auth + RLS + realtime + storage, fast development | PlanetScale (no RLS), Neon (no auth), AWS RDS (too complex for start) |
| 2026-08-06 | **Blockchain Phase 2-তে** | MVP-তে complexity কমানো, DB-based TC দিয়েও pilot possible | Day 1 blockchain (rejected — too slow to start) |
| 2026-08-06 | **Monorepo (Turborepo)** | Shared types, single CI/CD, easier refactoring | Separate repos (rejected — integration harder) |
| 2026-08-06 | **AI-first development** | Small team, fast iteration, expert audit at end | Traditional team (rejected — cost too high) |

---

## 16. Open Questions

> এই প্রশ্নগুলোর উত্তর এখনো নেই। উত্তর পেলে এখানে update করো এবং Decision Log-এ add করো।

| # | Question | Priority | Status |
|---|---|---|---|
| 1 | Pilot client কে হবে — কোন brand, কোন supplier? | 🔴 Critical | ❓ Open |
| 2 | EU client থাকলে Supabase EU region নিতে হবে — এখনই নাকি পরে? | 🟠 High | ❓ Open |
| 3 | TC-তে blockchain Phase 2-তে — কিন্তু pilot client কি blockchain ছাড়া TC accept করবে? | 🟠 High | ❓ Open |
| 4 | Pricing কীভাবে handle হবে — Stripe? manual invoice? | 🟡 Medium | ❓ Open |
| 5 | Mobile app কখন লাগবে — Phase 1 pilot-এ field auditor থাকবে? | 🟡 Medium | ❓ Open |
| 6 | Multi-language কখন — বাংলা কি Phase 1-এই লাগবে? | 🟡 Medium | ❓ Open |
| 7 | Self-hosted Supabase কখন migrate করবো? | 🟢 Low | ❓ Open |

---

## Glossary

| Term | মানে |
|---|---|
| **TC** | Transaction Certificate — material transfer-এর proof |
| **DPP** | Digital Product Passport — EU regulation, product-এর digital identity |
| **RLS** | Row Level Security — database-এ per-row access control |
| **Mass Balance** | Input material vs output product-এর হিসাব |
| **Tier 1** | Direct supplier (garment factory) |
| **Tier 2** | Tier 1-এর supplier (fabric mill) |
| **CSRD** | Corporate Sustainability Reporting Directive (EU, 2024) |
| **CSDDD** | Corporate Sustainability Due Diligence Directive (EU, 2027) |
| **EUDR** | EU Deforestation Regulation |
| **REACH** | Registration, Evaluation, Authorisation of Chemicals (EU) |
| **ESG** | Environmental, Social, Governance |
| **GRI** | Global Reporting Initiative (sustainability framework) |
| **ADR** | Architecture Decision Record |

---

*এই document একটি living document। প্রতিটি step-এর পরে update করো।*
*Last updated: 2026-08-06 | Version: 0.1*
