# STT Platform — Design System
> **Source of truth:** `docs/STT_Interactive_Prototype.html` (Interactive Prototype v1.0)
> **Status:** Locked — UI work must follow this file. Do not invent alternate palettes.
> **Last updated:** 2026-08-07

---

## 0. How to use this guide

1. Before any UI / CSS / component work → read this file + skim the prototype.
2. If product plan colors conflict with this guide → **this guide wins**.
3. Tokens live in `apps/web/app/globals.css` as CSS variables — keep them in sync with §1.
4. Checklist: `CHECKLIST.md` · Plan: `PROJECT_PLAN.md`

---

## 1. Brand tokens

### 1.1 Color

| Token | Hex | CSS var | Use |
|---|---|---|---|
| Navy | `#0E2A47` | `--stt-navy` | Sidebar background |
| Navy deep | `#081C33` | `--stt-navy-deep` | Top chrome, login left panel, toasts |
| Navy ink | `#123A63` | `--stt-navy-ink` | Dark button hover |
| Green | `#12A45B` | `--stt-green` | Primary CTA, active nav, success accent |
| Green dark | `#0B7A42` | `--stt-green-dark` | Primary hover |
| Green soft | `#E6F6EE` | `--stt-green-soft` | Success badge / soft fills |
| Background | `#F2F5F9` | `--stt-bg` | App canvas |
| Card | `#FFFFFF` | `--stt-card` | Surfaces |
| Line | `#E3E9F1` | `--stt-line` | Borders / dividers |
| Ink | `#16283C` | `--stt-ink` | Primary text |
| Muted | `#5D7189` | `--stt-muted` | Secondary text |
| Faint | `#94A6BB` | `--stt-faint` | Table headers, hints |
| Red | `#D64545` | `--stt-red` | Danger / exception |
| Red soft | `#FCEBEB` | `--stt-red-soft` | Danger badge bg |
| Amber | `#D98A1F` | `--stt-amber` | Warning |
| Amber soft | `#FCF3E3` | `--stt-amber-soft` | Warning badge bg |
| Blue | `#2D6CDF` | `--stt-blue` | Info / in-transit |
| Blue soft | `#E9F0FD` | `--stt-blue-soft` | Info badge / notes |
| Purple | `#7A4FD0` | `--stt-purple` | AI / marketplace accents |
| Purple soft | `#F1EBFB` | `--stt-purple-soft` | AI tag bg |

**Deprecated (do not use):** `#0A1628`, `#00A651` from early PROJECT_PLAN drafts.

### 1.2 Radius & elevation

| Token | Value | Use |
|---|---|---|
| `--stt-radius` | `12px` | Cards, KPI tiles |
| Button radius | `9px` (sm: `7px`) | Buttons |
| Pill | `999px` | Badges, chips, avatars |
| Modal radius | `16px` | Dialogs |
| Shadow | `0 1px 2px rgba(14,42,71,.06), 0 4px 14px rgba(14,42,71,.06)` | Cards |

### 1.3 Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| Display | **Sora** | 600, 700, 800 | Logo, page titles, KPI values |
| Body / UI | **Inter** | 400, 500, 600, 700 | Default UI text |
| Mono | **JetBrains Mono** | 500, 600 | IDs (`TC-08841`), codes, % |

- Base UI size: **13px** (dense B2B dashboard)
- Page title (topbar): Sora ~15.5px / 700
- KPI value: Sora ~23px / 700
- Table header: 10px uppercase, letter-spacing ~0.6px, color faint
- Logo wordmark: custom STT mark (S ink · first T green · second T ink, slash cut) + tagline `SUPPLY CHAIN TRACKING & TRACEABILITY`
- Component: `components/brand/brand-logo.tsx`

### 1.4 Brand copy

- Product name: **STT** / Smart Traceability Technology
- Login hero: *One Platform. Complete Transparency. From Source to Consumer.*
- Powered by: *SGC Global Assurance · Advancing Trust. Enabling Sustainability.*

---

## 2. App shell

```
┌──────────────────────────────────────────────────────────┐
│ Optional dark chrome (prototype deck only — not in app)  │
├──────────────┬───────────────────────────────────────────┤
│ Sidebar      │ Topbar (white, 52px)                       │
│ navy #0E2A47 │ Title (Sora) + subtitle + tools + avatar  │
│ ~198–220px   ├───────────────────────────────────────────┤
│              │ Body — bg #F2F5F9, padding ~16–18px       │
│              │ Cards / KPIs / tables                     │
└──────────────┴───────────────────────────────────────────┘
```

### Sidebar rules
- Background: navy (`#0E2A47`)
- Logo: `S` + green `TT` on dark
- Nav groups with section labels (uppercase, 9px, muted):
  - **Operate** — Dashboard, Orders, Materials, Material Wallet, Supply Chain
  - **Assure** — Risk Hub, Compliance, Sustainability, Verification
  - **Decide** — Reports, Alerts, Membership
- Idle item: muted blue-grey text
- Active item: solid green background, white text
- Optional red count pill on Risk / Alerts

### Topbar rules
- White card surface, bottom border `line`
- Left: page title + muted subtitle
- Right: date range / filters, notification bell (badge), avatar (green circle + initials)

### Login (auth) layout
- **Split screen** — not a lone centered card on flat bg
- Left (~55%): navy-deep → navy gradient, logo, hero headline (green accent on last line), short value prop, stats row, SGC footer
- Right: light bg, centered white card form (email, password, primary Sign in, outline SSO)

### Public DPP (`/p/[id]`)
- No app sidebar — consumer-facing, clean light surface, chain story + materials

---

## 3. Component patterns

| Pattern | Spec |
|---|---|
| **KPI** | Card + small muted label + Sora value + delta (`.up` green / `.dn` red / `.wr` amber) |
| **Card** | White, 1px line, radius 12, soft shadow; optional header with title + right actions |
| **Button primary** | Green bg, white text; hover green-dark |
| **Button outline** | White + line border; hover green border/text |
| **Button dark** | Navy bg; hover navy-ink |
| **Badge** | Pill; soft bg + strong text (g/r/a/b/p/n variants) + optional 6px dot |
| **Table** | Faint uppercase headers; row hover `#F7FAFD`; mono for IDs |
| **Tabs** | Segmented control on `#EAEFF5` track; active = white + light shadow |
| **Progress bar** | 6px height, track `#E8EDF4`, fill by status color |
| **Timeline** | Vertical line + green/grey dots |
| **Chain nodes** | Horizontal tier steps, soft green icon tiles, mono TC links |
| **Note** | Blue-soft box for guidance |
| **Warn** | Red-soft box for ledger / risk warnings |
| **AI tag** | Purple-soft chip with `✦` prefix |
| **Modal** | Overlay navy-deep @ 55% + blur; white panel radius 16 |
| **Toast** | Navy-deep, bottom-right, green bold accents |
| **Membership lock** | Red gradient banner + greyscale/locked body when expired |

### Status → badge mapping (default)

| Status family | Badge |
|---|---|
| Completed / Delivered / On Track / Compliant / Low | green |
| In Transit / In Progress / Monitoring | blue |
| Review / Gap / Medium / Investigating | amber |
| Exception / Open / Critical / High / At Risk | red |
| Open for Bids / AI / marketplace | purple |
| Not Started / neutral | muted grey |

---

## 4. Screen inventory (from prototype)

Build UI against these intents (MVP may ship a subset):

1. Login / SSO / MFA messaging  
2. Guided onboarding (5 phases, 7–21 days)  
3. Executive dashboard  
4. Order intelligence  
5. AI material intelligence  
6. Material wallet + TC + mass balance  
7. Supply chain declaration (tier 1→6)  
8. Risk Hub  
9. Compliance command center  
10. Sustainability intelligence  
11. Verification marketplace  
12. DPP public consumer view  
13. Reports & dashboards  
14. Alerts & notifications  
15. Membership & billing (+ expiry state)

---

## 5. UX principles

1. **Dense enterprise** — prefer information density over marketing whitespace in app shell.
2. **Green = go / verified / active** — primary actions and healthy states.
3. **Always show status** — badges, not color-only icons.
4. **IDs are mono** — TC, TRF, ORD, VR codes must use JetBrains Mono.
5. **Critical writes use modals** — transfer, TC issue, verification request.
6. **Toast for success** — short confirmation after mutations.
7. **Org isolation is invisible but absolute** — never show cross-tenant data in UI.
8. **Respect reduced motion** — honor `prefers-reduced-motion`.

---

## 6. Do / Don't

### Do
- Match prototype tokens exactly
- Use Sora for display numbers and titles
- Keep sidebar navy + green active state
- Use soft status badge pairs (bg + text)

### Don't
- Invent purple-on-white marketing gradients for the app shell
- Use Inter/Geist as display for KPIs
- Flat single-color hero login without brand panel
- Hard-delete visual patterns that exist in the prototype without updating this doc

---

## 7. File map

| File | Role |
|---|---|
| `docs/STT_Interactive_Prototype.html` | Visual reference (v1.0) |
| `docs/DESIGN_SYSTEM.md` | This guide |
| `apps/web/app/globals.css` | Live CSS tokens |
| `apps/web/components/layout/*` | Shell components |
| `CHECKLIST.md` | Execution progress |

---

*When in doubt: open the prototype, match it, then code.*
