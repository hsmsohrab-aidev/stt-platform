# STT Platform — Execution Checklist
> Phase 0 → Phase 1 ধাপে ধাপে। প্রতিটি কাজ শেষে `[x]` মার্ক করো।
> Last updated: 2026-08-06

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
- [ ] Full schema.sql applied (Phase 1.1)
- [ ] GitHub Secrets for CI (with 0.6)

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
- [x] Brand colors (navy `#0A1628`, green `#00A651`)
- [x] Base components: Button, Card, Input, Badge, Table
- [x] Layout: Sidebar, Header, PageWrapper

### Step 0.5 — Auth (Multi-tenant)
- [x] Supabase clients (`@supabase/ssr`) in web
- [x] Core tables + RLS (orgs, profiles, roles, members)
- [x] Login / register pages + server actions
- [x] Middleware auth redirect (protect app, allow `/login` `/register` `/p/*`)
- [x] Signup trigger creates `profiles` row
- [ ] Org onboarding flow (Step 1.2)
- [ ] Manual E2E login test in browser

### Step 0.6 — CI/CD
- [x] GitHub Actions: lint → typecheck → build
- [ ] Vercel deploy (web)
- [ ] Railway deploy (api) — when api ready

## Phase 1 — MVP (after Phase 0)
- [ ] 1.1 Core DB schema (5 tables + remaining from schema.sql)
- [ ] 1.2 Organization onboarding
- [ ] 1.3 Facility declaration
- [ ] 1.4 Material wallet
- [ ] 1.5 TC issuance
- [ ] 1.6 Brand dashboard
- [ ] 1.7 Supplier dashboard
- [ ] 1.8 Pilot testing
