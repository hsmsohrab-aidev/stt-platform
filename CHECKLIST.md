# STT Platform — Execution Checklist
> Phase 0 → Phase 1 ধাপে ধাপে। প্রতিটি কাজ শেষে `[x]` মার্ক করো।
> Design source of truth: `docs/DESIGN_SYSTEM.md` + `docs/STT_Interactive_Prototype.html`
> Last updated: 2026-08-07

## Phase 0 — Foundation

### Step 0.0 — Project Planning
- [x] PROJECT_PLAN.md created
- [x] SCHEMA_REFERENCE.md + schema.sql ready
- [x] Shared types (`packages/types/index.ts`) ready
- [x] Cursor rules (`.cursor/rules`) ready
- [x] Document pushed to GitHub

### Step 0.1 — GitHub Repository Setup
- [x] Repo created: `hsmsohrab-aidev/stt-platform`
- [x] Local git init + remote connected
- [x] Initial commit + push to `main`
- [ ] `.github/CODEOWNERS` (optional later)
- [ ] Branch protection on `main` (manual on GitHub)

### Step 0.2 — Supabase Project Setup
- [x] Dedicated STT Supabase project created (`vekrunjeyrvkhkwsxbxm`)
- [x] Project-scoped MCP (`.cursor/mcp.json`) — not global
- [x] `.env.local` with URL + keys (gitignored)
- [x] `.env.example` committed (empty values)
- [x] Auth core schema applied (orgs, profiles, roles, members + RLS)
- [x] MVP schema applied (facilities, materials, wallets, TCs) — Phase 1.1
- [ ] Remaining non-MVP schema (orders/DPP/risk/…) later phases
- [ ] GitHub Secrets for CI (with deploy)

### Step 0.3 — Monorepo Structure
- [x] Root `package.json` + workspaces / Turborepo
- [x] `turbo.json`
- [x] `apps/web` — Next.js 14 App Router + Supabase SSR + `@stt/types`
- [x] `apps/api` — NestJS scaffold (`/api/health`)
- [x] `packages/types` package wired
- [x] `packages/database` package scaffold
- [x] `packages/ui` package scaffold
- [x] Web typecheck + build passing

### Step 0.4 — Design System
- [x] shadcn/ui init on `apps/web` (Tailwind v4)
- [x] **Design guide locked** from interactive prototype → `docs/DESIGN_SYSTEM.md`
- [x] Prototype archived → `docs/STT_Interactive_Prototype.html`
- [x] Brand tokens synced (navy `#0E2A47`, green `#12A45B`, Sora/Inter/JetBrains Mono)
- [x] Split login + navy sidebar shell matching prototype
- [x] Base components: Button, Card, Input, Badge, Table
- [x] Layout: Sidebar (Operate/Assure/Decide), Header, PageWrapper

### Step 0.5 — Auth (Multi-tenant)
- [x] Supabase clients (`@supabase/ssr`) in web
- [x] Core tables + RLS (orgs, profiles, roles, members)
- [x] Login / register pages + server actions
- [x] Middleware auth redirect
- [x] Signup trigger creates `profiles` row
- [ ] Org onboarding flow (Step 1.2)
- [ ] Manual E2E login test in browser

### Step 0.6 — CI/CD
- [x] GitHub Actions: lint → typecheck → build
- [ ] Vercel deploy (web)
- [ ] Railway deploy (api) — when api ready

## Phase 1 — MVP

### Step 1.1 — Core Database Schema
- [x] organizations, profiles, roles, organization_members
- [x] facilities + declarations + supplier_relationships + supply_chain_tiers + certs
- [x] materials (seeded) + material_wallets + wallet_balances + transactions + mass_balance
- [x] transaction_certificates + line items + verifications + documents
- [x] invitations
- [x] RLS + wallet sync trigger + TC number generator
- [ ] TypeScript types regen from live DB (optional polish)

### Step 1.2 — Organization Onboarding
- [ ] Registration chooses brand vs supplier
- [ ] Create organization + link profile as owner
- [ ] Assign default admin role
- [ ] Onboarding checklist UI (5 phases from prototype)

### Step 1.3 — Facility Declaration
- [ ] Facility add form
- [ ] Tier selection
- [ ] Facility list

### Step 1.4 — Material Wallet
- [ ] Wallet dashboard
- [ ] Credit / debit transactions
- [ ] Mass balance view

### Step 1.5 — TC Issuance
- [ ] TC create + line items
- [ ] Issue with balance check
- [ ] PDF/QR later polish

### Step 1.6 — Brand dashboard
- [ ] Supply chain + TC list basics

### Step 1.7 — Supplier dashboard
- [ ] Wallet + TC shortcuts

### Step 1.8 — Pilot testing
- [ ] Real brand + suppliers pilot
