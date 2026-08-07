# STT Final.pdf — UI / Dashboard Inventory & Gap Notes

**Source:** `D:\SAAS\STT\STT Final.pdf` (32 pages, image-based deck)  
**Captured:** 2026-08-07  
**Purpose:** Team-discussion mockups → feature/KPI/chart inventory for later action list.  
**Not implemented yet** — notes only.

OCR artifacts live under `.pdf-review/ocr/` (local only).

---

## Deck map (by page)

| Pages | Theme |
|------:|-------|
| 01–08 | Positioning, visibility gap (Tiers 1–6), regulations (DPP/CSDDD/CSRD/FLR), why STT |
| 09 | Ecosystem stakeholders (Brand, Supplier, Logistics, Auditor, Regulator, Finance) |
| **10** | **Order Intelligence** (dashboard mock) |
| **11** | **AI Material Intelligence** (dashboard mock) |
| **12** | **Risk Hub** (dashboard mock + heat map) |
| **13** | **Compliance Command Center** (dashboard mock) |
| **14** | **Sustainability Intelligence** (dashboard mock) |
| **15** | **Insights & Analytics** (executive dashboard mock) |
| **16** | **Reports & Dashboards** (builder / exports mock) |
| **17** | **Alerting & Notifications** (ops mock) |
| 18 | Integration & Ecosystem (ERP/PLM/WMS/TMS…) |
| 19–22 | Use cases, differentiators, tech/security, solutions/engagement |
| 23–29 | Market, roadmap, pricing, policies, trust, future |
| 30 | Implementation / onboarding journey |
| **31** | **Verification Marketplace** (journey + services) |
| 32 | Thank you / CTA |

---

## Capability modules in the PDF (what “done” looks like)

### A. Order Intelligence (p10)
**KPIs:** Total Orders · In Transit · On Time % · Exceptions  
**Viz:** Order Tracking Map (map view) · Order Status donut/pie · Recent Orders table (Order ID, Origin, Destination, Status, ETA) · Journey strip (Created → In Transit → Monitored → Delivered → Insights)  
**Features:** Real-time tracking · Milestone & exception alerts · Live location & ETA · Multi-tier visibility · Order analytics & bottlenecks  
**Filters:** Date range · All Locations  

### B. AI Material Intelligence (p11)
**KPIs:** Total Materials · High Risk Materials · Verified Materials · Sustainability Claims Verified %  
**Viz:** Material Risk Distribution · Top Material Risk by Category (bar) · Sustainability Verification Status · Material Intelligence List (Name, Category, Source, Risk, Compliance score /100, Last Updated)  
**Features:** Material ID from docs/certs · Risk assessment · Sustainability verification · Regulatory mapping (DPP, CSRD, CSDDD, EUDR, REACH, 50+)  
**Nav tabs in mock:** Overview · Materials · Risk Hub · Compliance · Insights · Reports · Alerts · Settings  

### C. Risk Hub (p12)
**KPIs:** Critical Alerts · High Risk Items · At Risk Items · Monitored Entities  
**Viz:** **Risk Heat Map** · Risk by Category (donut) · Risk Trend (90 days line) · Top Risk Alerts table (Entity, Type, Level, Description, Status, Action)  
**Features:** Multi-dimensional monitoring · AI risk scoring · Real-time alerts · Drill-down / root cause · Mitigation & action tracking · Risk reporting  
**Process:** Identify → Assess → Prioritize → Mitigate → Monitor → Report  

### D. Compliance Command Center (p13)
**KPIs:** Compliance score % · Open Incidents · Upcoming Deadlines · Controls counts (compliant / gap / attention)  
**Viz:** Compliance by Regulation · Compliance Trend · Status by Category (Environment, Labor, H&S, Ethics…) · Upcoming Compliance Tasks table  
**Features:** Regulation management · Workflow automation · Control & evidence management · Audit readiness · Alerts · Reporting  
**Frameworks called out:** CSRD · CSDDD · EUDR · REACH · 50+  

### E. Sustainability Intelligence (p14)
**KPIs:** Overall score · CO₂e total · Waste diverted % · (energy/water implied)  
**Viz:** Emissions Overview (Scope 1/2/3 split) · Emissions Trend · Performance by Pillar · Goal/target progress table  
**Features:** ESG data collection · Scope 1–3 footprint · Framework reports (GRI, SASB, TCFD, CDP, CSRD) · Goal setting · Supplier sustainability assessment  
**Nav tabs:** Overview · Emissions · Energy · Water · Waste · Suppliers · Alerts · Settings  

### F. Insights & Analytics (p15)
**KPIs:** On-time % · Total Orders · Total Spend · High Risk Items · CO₂e  
**Viz:** Spend by Category · Risk Score Trend · Suppliers by Performance · Alerts by Type · “Insight of the Week”  
**Features:** Unified dashboards · Advanced analytics · Predictive intelligence · Custom reporting · Alerts · Data integration (ERP, WMS/TMS, portals, IoT, docs, market data)  

### G. Reports & Dashboards (p16)
**KPIs:** Reports generated · Data exports · Active users · Active schedules  
**Viz:** Top report categories · Users by role · Reports over time · Recent reports list  
**Features:** Real-time dashboards · Custom report builder · Scheduled reports · Export Excel/PDF/CSV/PPTX · Filters & drill-down · Role-based access · Historical trends  

### H. Alerting & Notifications (p17)
**KPIs:** Total / Critical / High / Medium / Low · Avg response time  
**Viz:** Alerts by Category · Over Time · By Severity · By Status · Recent Alerts table  
**Features:** Intelligent/rule-based alerts · Role-based delivery · Multi-channel (Email, In-app, SMS, Teams, webhooks, ServiceNow…) · Escalation · Alert analytics · Audit trail  

### I. Verification Marketplace (p31) + ecosystem (p09)
**Journey:** Buyer Request → Marketplace publish → Approved auditor · Verification · Digital report · Verified status  
**Services:** Certificate · Physical · Material · Social · Capacity · Environmental · ESG · Supply chain · Compliance  
**Categories:** Raw material · Manufacturing · Products · Logistics  
**Integrates with:** TC · Material Wallet · DPP  

### J. Cross-cutting (elsewhere in deck)
- Tier 1–6 visibility depth / “invisible tiers” narrative (p03)  
- Supply Chain Declaration Engine (p24 differentiators)  
- Mass Balance Engine · Order-based material forecasting (p24)  
- DPP + QR consumer passport (multiple)  
- Blockchain / Hyperledger integrity (p21)  
- Onboarding: Registration → Chain mapping → Material Wallet → TC → Live ops (p30)  

---

## Current app vs PDF (honest snapshot)

Legend: **Have** / **Partial** / **Missing**

| PDF module | App today | Gap summary |
|------------|-----------|-------------|
| Order Intelligence | **Partial** | Orders list + detail + charts; **no** live tracking map, on-time KPI, exception queue UX, milestone timeline like mock |
| Material Intelligence | **Partial** | Materials catalog + wallet; **no** AI risk scores, risk-by-category charts, compliance score /100, regulatory mapping matrix |
| Risk Hub | **Partial** | Derived flags + severity donut; **no** heat map, 90-day trend, mitigation workflow, monitored-entity KPI |
| Compliance Command Center | **Partial** | Derived tasks + standards labels; **no** regulation scorecards, evidence vault, deadline calendar, workflow automation |
| Sustainability Intelligence | **Partial** | Derived score + links; **no** Scope 1/2/3 charts, goal tracker, framework report pack |
| Insights & Analytics | **Partial** | Home interactive overview + report summary; **no** executive unified KPIs (spend, on-time, CO₂e together), predictive insights |
| Reports & Dashboards | **Partial** | Print-ish ops pack; **no** custom builder, schedules, multi-format export, role analytics |
| Alerting | **Partial** | In-app notifications; **no** severity dashboards, rules UI, multi-channel, escalation, response-time KPI |
| Verification Marketplace | **Partial** | VR create/claim/complete; **no** full marketplace UX, service catalog, digital-signed report gallery |
| Supply chain map / tiers | **Partial** | Stylized map + tier flow; **not** PDF-grade geo tracking map / heat map |
| DPP | **Partial** | Draft/publish/QR; deepen passport data fields vs ESPR mock |
| Integrations | **Missing** | ERP/PLM/WMS connectors |
| Blockchain integrity UI | **Partial** | TC anchor exists; not full integrity dashboard |

---

## Likely “dashboard shells” implied by PDF mocks

Each capability page shows a **left nav + KPI row + 2–3 charts + table + filters (date, location, category)**.  
For action planning later, treat these as **8 product dashboards** (A–H) + Verification Marketplace, not just empty hubs.

---

## Suggested action-list buckets (ready when you say go)

→ **Full prioritized backlog:** [`docs/STT_ACTION_LIST.md`](./STT_ACTION_LIST.md)

1. **P0 — Match PDF capability dashboards to existing routes**  
   Orders · Risk · Compliance · Sustainability · Reports · Alerts · Materials/Wallet · Verification  
2. **P0 — Shared dashboard kit**  
   KPI strip · date/location filters · heat map · trend line · status donut · drill-down table  
3. **P1 — Maps**  
   Order tracking map (ports/routes) · Risk heat map · Tier visibility depth meter  
4. **P1 — Hub completeness**  
   Brand / Supplier / Auditor = role-filtered views of the same capability data (not empty shells)  
5. **P2 — Marketplace polish + evidence + mitigation workflows**  
6. **P3 — Integrations, predictive AI copy, multi-channel alerts**

---

## Open questions for you (before build)

1. Exact visual reference priority: **pixel-follow PDF mocks** vs **STT design system** (Sora/Inter, green/navy) with PDF information architecture?  
2. Which role first for “PDF-complete” dashboards: Brand Super Admin, Supplier, or Auditor?  
3. Real GIS map (Mapbox/Leaflet) acceptable, or stay stylized SVG?

---

*When you ask for the action list, we can turn section “Suggested buckets” into a sequenced backlog with acceptance criteria per widget.*
