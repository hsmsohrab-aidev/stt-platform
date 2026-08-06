# STT Platform — Execution Checklist
> Phase 0 → Phase 1 ধাপে ধাপে। প্রতিটি কাজ শেষে `[x]` মার্ক করো।
> Last updated: 2026-08-06

## Phase 0 — Foundation

### Step 0.0 — Project Planning
- [x] PROJECT_PLAN.md created
- [x] SCHEMA_REFERENCE.md + schema.sql ready
- [x] Shared types (`packages/types/index.ts`) ready
- [x] Cursor rules (`.cursor/rules`) ready
- [ ] Document pushed to GitHub

### Step 0.1 — GitHub Repository Setup
- [x] Repo created: `hsmsohrab-aidev/stt-platform`
- [x] Local git init + remote connected
- [ ] Initial commit + push to `main`
- [ ] `.github/CODEOWNERS` (optional later)
- [ ] Branch protection on `main` (manual on GitHub)

### Step 0.2 — Supabase Project Setup
- [x] Dedicated STT Supabase project created (`vekrunjeyrvkhkwsxbxm`)
- [x] Project-scoped MCP (`.cursor/mcp.json`) — not global
- [x] `.env.local` with URL + keys (gitignored)
- [x] `.env.example` committed (empty values)
- [ ] Schema applied to STT Supabase
- [ ] GitHub Secrets for CI (later with 0.6)

### Step 0.3 — Monorepo Structure
- [ ] Root `package.json` + workspaces / Turborepo
- [ ] `turbo.json`
- [ ] `apps/web` — Next.js 14 App Router complete
- [ ] `apps/api` — NestJS scaffold
- [ ] `packages/types` package wired
- [ ] `packages/database` package scaffold
- [ ] `packages/ui` package scaffold
- [ ] `npm run dev` runs web (api later)

### Step 0.4 — Design System
- [ ] shadcn/ui init on `apps/web`
- [ ] Brand colors (navy `#0A1628`, green `#00A651`)
- [ ] Base components: Button, Card, Input, Badge, Table
- [ ] Layout: Sidebar, Header, PageWrapper

### Step 0.5 — Auth (Multi-tenant)
- [ ] Supabase clients (`@supabase/ssr`) in web
- [ ] Core tables + RLS (orgs, profiles, roles)
- [ ] Login / register pages
- [ ] Middleware auth redirect
- [ ] Org isolation verified

### Step 0.6 — CI/CD
- [ ] GitHub Actions: lint → typecheck → build
- [ ] Vercel deploy (web)
- [ ] Railway deploy (api) — when api ready

## Phase 1 — MVP (after Phase 0)
- [ ] 1.1 Core DB schema (5 tables)
- [ ] 1.2 Organization onboarding
- [ ] 1.3 Facility declaration
- [ ] 1.4 Material wallet
- [ ] 1.5 TC issuance
- [ ] 1.6 Brand dashboard
- [ ] 1.7 Supplier dashboard
- [ ] 1.8 Pilot testing
