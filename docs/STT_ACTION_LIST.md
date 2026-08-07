# STT — Prioritized Action List (from STT Final.pdf)

**Based on:** `docs/STT_FINAL_PDF_NOTES.md` + current `apps/api` routes  
**Default role focus:** Super Admin / Brand (platform_admin) first, then Supplier & Auditor views  
**Visual rule:** STT design system (Sora/Inter, navy/green) + PDF information architecture (KPI → charts → table → filters) — not pixel-clone  
**Maps:** Phase 1 stylized SVG; Phase 2 optional Leaflet/Mapbox if you approve  

---

## How to read this list

| Field | Meaning |
|-------|---------|
| **P0** | Must ship for “PDF-shaped” product feel |
| **P1** | Strong pilot differentiator |
| **P2** | Deep workflows / marketplace polish |
| **P3** | Enterprise / integrations / later |
| **Size** | S ≤1–2d · M ~3–5d · L ≥1–2w (one focused engineer) |

Status: `Todo` until you assign.

---

## Phase 0 — Foundation (do first)

| ID | Action | Route(s) | Size | Acceptance |
|----|--------|----------|------|------------|
| **F1** | Shared dashboard kit: `StatBoxes`, date/location/category filter bar, section shell | `components/charts/*`, layout helpers | M | Every capability page can mount same KPI + filter + chart grid without copy-paste |
| **F2** | Shared chart set: trend line, stacked bar, heat-map grid, severity donut (extend existing SVG kit) | `components/charts/` | M | Heat map + 90-day trend usable on Risk; trend reusable on Compliance/Sustainability |
| **F3** | Clickable-row convention + empty states (no “demo/pilot” copy on product pages) | All list pages | S | Primary cell + Open → detail; empty copy is actionable (link to create/related) |
| **F4** | Seed/data contract: ensure ≥25 rows feed each P0 dashboard KPI (already mostly seeded) | Demo seed | S | Each P0 page shows non-zero KPIs for host Super Admin org |

---

## P0 — Capability dashboards (PDF pages 10–17 → existing menus)

### 1. Order Intelligence → `/orders` (+ `/shipments`)

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **O1** | KPI strip: Total · In Transit · On-time % · Exceptions | S | Matches PDF p10 KPI meanings from live orders/shipments |
| **O2** | Order status donut + recent orders table (already partial) — align columns: Origin, Destination, Status, ETA | S | Columns + click → `/orders/[id]` |
| **O3** | Order tracking map (ports/routes from shipments) on Orders or Shipments | M | Interactive pins; click opens shipment detail |
| **O4** | Milestone / journey strip on order detail (Created → Production → Shipped → Delivered) | S | Driven by order status + linked shipments/events |
| **O5** | Exception queue panel (delayed / exception shipments) | S | Filterable list with links |

### 2. Risk Hub → `/risk`

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **R1** | KPI strip: Critical · High · At-risk · Monitored entities | S | Counts from derived + ops entities |
| **R2** | **Risk heat map** (severity × category or supplier × severity) | M | Click cell → filtered flag list |
| **R3** | Risk trend (last 90 days) — synthetic from flag timestamps / notifications if no history table | M | Line chart on page |
| **R4** | Top risk alerts table with Status + View action (link already partial) | S | Matches PDF table columns |
| **R5** | Mitigation stub: status field or note on flag (open / in progress / closed) | M | Persistible without full case-mgmt yet |

### 3. Compliance Command Center → `/compliance`

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **C1** | KPI: Compliance % · Open incidents · Upcoming deadlines · Controls attention | S | Derived + cert expiry dates |
| **C2** | Compliance by regulation cards (DPP / CSRD / CSDDD / EUDR / REACH readiness) | M | Score/status per framework from live evidence |
| **C3** | Compliance trend + status-by-category bars | M | Charts on page |
| **C4** | Upcoming tasks table (deadline, owner optional, progress, regulation) | S | Links to TC / verification / facilities |
| **C5** | Evidence links panel (certs, TC, audit reports) — read-only vault v1 | M | List + open related records |

### 4. Sustainability Intelligence → `/sustainability`

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **S1** | KPI: Score · Total CO₂e · Waste diverted % (passport / derived) | S | Numbers from DPP sustainability + facilities |
| **S2** | Scope 1 / 2 / 3 breakdown chart + emissions trend | M | Use passport fields + seeded estimates clearly labeled if estimated |
| **S3** | Goals / targets progress table (seed 4–6 goals) | M | Progress bars + status |
| **S4** | Framework alignment strip (GRI, SASB, TCFD, CDP, CSRD) | S | Status chips linked to Reports |

### 5. Home Insights → `/` (Executive Overview)

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **H1** | Unified KPI row: On-time % · Orders · Spend proxy · High-risk · CO₂e | M | One glance PDF p15 style |
| **H2** | Keep interactive map/journey; deepen pins (partners + ports) — mostly done | S | Pin → correct detail href |
| **H3** | “Insight of the week” card from top risk or delay signal | S | Dynamic one-liner + link |

### 6. Materials + Wallet → `/materials` + `/wallet`

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **M1** | Material Intelligence overview on `/materials` or new `/materials/intelligence` tab | M | KPIs: total · high risk · verified |
| **M2** | Risk distribution + top risk by category charts | M | From material type + wallet + TC linkage |
| **M3** | Material list with Risk level + Compliance score (/100) columns | M | Click → wallet or TC related |
| **M4** | Regulatory mapping chips (DPP/CSRD/CSDDD/EUDR/REACH) per material/standard | S | Static map v1 from standard field |

### 7. Alerts → `/alerts`

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **A1** | KPI: Total · Critical · High · Medium · Low (+ unread) | S | From notifications.severity |
| **A2** | Charts: by category · by severity · over time | M | Donut/bar/trend |
| **A3** | Richer alert rows: severity, module, assigned/open, deep link (partial) | S | Full click-through |
| **A4** | Alert rules UI v1 (create threshold rule stored in DB or config table) | L | At least 2 rule types (low wallet, cert expiry) |

### 8. Reports → `/reports`

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **P1r** | Report catalog list (Risk / Compliance / Ops / ESG) with Generate | M | Each opens printable view or filtered page |
| **P2r** | Export buttons: PDF (print) + CSV for current tables | M | Works on Orders, TC, Risk flags |
| **P3r** | Recent reports history (generated_at, type, requested_by) — table in DB optional | L | At least session/local history v1 |

### 9. Verification Marketplace → `/verification` + `/auditor`

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **V1** | Marketplace board UX: Open / Mine / Completed tabs + service type badges | M | PDF p31 journey visible |
| **V2** | Service catalog chips (Certificate, Physical, Social, Material, ESG…) | S | Filter requests by type |
| **V3** | Digital report gallery on Auditor hub (title, score, date, open) | S | From audit_reports |
| **V4** | Status pipeline strip: Request → Marketplace → Auditor → Report → Verified | S | On verification page |

---

## P1 — Maps, hubs, chain depth

| ID | Action | Route | Size | Acceptance |
|----|--------|-------|------|------------|
| **SC1** | Tier visibility depth meter (“visible Tier-1 vs invisible Tier-2–6”) | `/supply-chain` | S | % facilities/suppliers mapped per tier |
| **SC2** | Interactive tier flow already partial — ensure every node opens hub/facility | `/supply-chain` | S | Click → Brand/Supplier/Facilities |
| **SC3** | Geo upgrade option: Leaflet map for facilities + shipment ports | `/` + `/shipments` | L | Toggle or replace stylized map |
| **B1** | Brand hub = filtered Order + Risk + Compliance + TC summary (partial — finish parity) | `/brand` | M | Same KPIs as PDF brand value props |
| **U1** | Supplier hub = facilities + wallet + issued TC + inbound PO (partial — finish) | `/supplier` | M | No empty Super Admin path |
| **U2** | Auditor hub = marketplace + reports + assignments (partial — finish) | `/auditor` | M | Non-empty with 25 VRs |

---

## P2 — Workflows & trust

| ID | Action | Size | Acceptance |
|----|--------|------|------------|
| **W1** | Compliance evidence upload + attach to task/flag | L | File in storage + link row |
| **W2** | Risk mitigation owners + due dates + close-out | M | Full mini workflow |
| **W3** | Verification digital sign / publish report UX polish | M | Buyer sees verified badge on supplier |
| **W4** | DPP field completeness vs ESPR (care, repair, recyclability, chemicals) | M | Passport form + public page |
| **W5** | Mass-balance / declaration engine UI (PDF differentiator) | L | Declaration list + status |

---

## P3 — Later / enterprise

| ID | Action | Size | Notes |
|----|--------|------|-------|
| **E1** | Multi-channel alerts (email/SMS/Teams) | L | Needs providers |
| **E2** | Custom report builder + schedules | L | PDF p16 full |
| **E3** | ERP/PLM/WMS connectors | L | PDF p18 |
| **E4** | Predictive ML copy → real models | L | Start with rule-based “insights” |
| **E5** | Full Hyperledger integrity dashboard | L | Beyond TC anchor |
| **E6** | Membership pricing / billing UI (PDF p25) | L | Business ops |

---

## Recommended build order (sprints)

### Sprint 1 — “Looks like the PDF”
1. F1 → F2 → F3  
2. O1–O5 · R1–R4 · A1–A3 · H1–H3  

> **Done (2026-08-07):** Chart kit + Order Intelligence + Risk heat map + Alerts dashboard + Home KPIs/insight shipped.

### Sprint 2 — “Decide & comply”
3. C1–C5 · S1–S4 · M1–M4 · P1r–P2r  

> **Done (2026-08-07):** Compliance Command Center · Sustainability Intelligence (Scope charts + goals + frameworks) · Material Intelligence (risk/100 + regs) · Reports catalog + CSV/print exports.

### Sprint 3 — “Trust & chain”
4. V1–V4 · SC1–SC2 · B1 · U1 · U2 · R5  

> **Done (2026-08-07):** Verification marketplace tabs/chips + JourneyStrip · Auditor report gallery · Supply-chain tier depth meter + node deep-links · Brand compliance KPI · Supplier pending PO count · Risk mitigation status (persisted).

### Sprint 4 — “Depth”
5. SC3 (if GIS approved) · W1–W5 · A4 · P3r  

> **Done (2026-08-07):** ESPR DPP fields + public passport · audit attestation + Brand “Audit verified” badge · risk owner/due/note · compliance evidence links · wallet mass-balance periods · alert rules UI · report export history. **SC3 Leaflet deferred** (SVG maps remain).

### Backlog
6. All P3 (E1–E6)

---

## Out of scope for first three sprints

- Pixel-perfect Figma recreation of every PDF slide  
- Real AI/ML training pipelines  
- Full ERP integrations  
- Multi-channel SMS/Teams  
- Billing / membership checkout  

---

## Decisions needed from you (blocks nothing for Sprint 1)

1. **Maps:** stay SVG stylized for Sprint 1–2, or start Leaflet now?  
2. **Spend KPI:** we don’t have order value everywhere — OK to use quantity×proxy or hide until priced?  
3. **Start coding Sprint 1 now?** (F + Orders + Risk + Alerts + Home)

---

*Living document — update status here when items complete.*
