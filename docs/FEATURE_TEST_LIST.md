# STT Platform — Feature Test List
> আপনি ঘুম থেকে উঠে **একে একে** টিক দিন।  
> Dev server: `npm run dev --workspace=web` → `http://localhost:3000`  
> দুই ব্রাউজার প্রোফাইল লাগবে (Brand + Supplier)।  
> Last updated: 2026-08-07 (Phase 2.3: Auditor + verification marketplace)

**Pass / Fail / Skip** কলামে লিখুন: `✅` / `❌` / `⏭`  
**Notes** এ bug বা স্ক্রিনশট রেফারেন্স রাখুন।

> **শুরু এখান থেকে:** সেকশন 0 → Quick path (নিচে) → তারপর বাকি সেকশন।

---

## 0. Prep
| # | Check | Result | Notes |
|---|---|---|---|
| 0.1 | Dev server চলে (`Ready`) | | |
| 0.2 | `.env.local` আছে (Supabase URL + anon) | | |
| 0.3 | দুই আলাদা ইমেইল দিয়ে টেস্ট অ্যাকাউন্ট তৈরি করতে পারব | | |

---

## 1. Auth
| # | Check | Result | Notes |
|---|---|---|---|
| 1.1 | `/register` — নতুন ইউজার সাইন আপ | | |
| 1.2 | `/login` — সঠিক পাসওয়ার্ডে লগইন | | |
| 1.3 | ভুল পাসওয়ার্ডে এরর দেখায় | | |
| 1.4 | লগআউট কাজ করে → আবার `/login` | | |
| 1.5 | লগআউট অবস্থায় `/wallet` → `/login?next=…` | | |
| 1.6 | লগইন অবস্থায় `/login` → `/` এ রিডাইরেক্ট | | |

---

## 2. Onboarding
| # | Check | Result | Notes |
|---|---|---|---|
| 2.1 | অর্গ ছাড়া ইউজার → `/onboarding` এ যায় | | |
| 2.2 | **Supplier** অর্গ তৈরি হয় | | |
| 2.3 | **Brand** অর্গ তৈরি হয় (অন্য ব্রাউজার) | | |
| 2.4 | **Auditor** অর্গ তৈরি হয় (ঐচ্ছিক) | | |
| 2.5 | অর্গ তৈরির পর wallet তৈরি (brand/supplier) | | |
| 2.6 | Owner membership + role বসে | | |
| 2.7 | Onboarding phase mark / finish কাজ করে | | |

---

## 3. App shell & speed
| # | Check | Result | Notes |
|---|---|---|---|
| 3.1 | Sidebar + topbar দেখায় (navy / design system) | | |
| 3.2 | Dashboard ↔ Wallet ↔ TC নেভিগেশন দ্রুত (কোল্ড কম্পাইল বাদে) | | |
| 3.3 | Loading skeleton দেখা যায় (স্লো নেটওয়ার্কে) | | |
| 3.4 | Error boundary থেকে Try again (ঐচ্ছিক ফোর্স) | | |

---

## 4. Facilities (`/facilities`)
| # | Check | Result | Notes |
|---|---|---|---|
| 4.1 | Facility declare (name, type, tier, city, country) | | |
| 4.2 | লিস্টে নতুন facility দেখায় | | |
| 4.3 | অন্য অর্গের facility দেখা যায় না (tenant isolation) | | |

---

## 5. Material Wallet (`/wallet`)
| # | Check | Result | Notes |
|---|---|---|---|
| 5.1 | Material সিলেক্ট করে credit (যেমন 1000 KG) | | |
| 5.2 | Balance card আপডেট হয় | | |
| 5.3 | Ledger-এ credit এন্ট্রি দেখায় | | |
| 5.4 | Qty ≤ 0 বা খালি material → validation error | | |
| 5.5 | আরেকবার credit → balance বাড়ে | | |

---

## 6. Brand ↔ Supplier link
| # | Check | Result | Notes |
|---|---|---|---|
| 6.1 | Supplier dashboard-এ **org UUID** কপি করা যায় | | |
| 6.2 | Brand `/brand` → Link supplier (UUID + tier) | | |
| 6.3 | Linked supplier লিস্টে নাম দেখায় | | |
| 6.4 | একই supplier দুবার link → duplicate error | | |
| 6.5 | Supplier org দিয়ে link চেষ্টা → reject | | |

---

## 7. Transaction Certificates (`/tc`)
| # | Check | Result | Notes |
|---|---|---|---|
| 7.1 | Receiver picker-এ org লিস্ট আসে | | |
| 7.2 | Linked partner ★ মার্ক দেখায় | | |
| 7.3 | Search দিয়ে receiver ফিল্টার হয় | | |
| 7.4 | TC issue (qty ≤ available) → TC number `TC-YYYY-######` | | |
| 7.5 | Wallet balance কমে (debit) | | |
| 7.6 | Over-issue (qty > balance) → reject | | |
| 7.7 | Issuer লিস্টে TC দেখায় | | |
| 7.8 | Receiver লিস্টে TC দেখায় | | |
| 7.9 | শুধু receiver **Verify** করতে পারে | | |
| 7.10 | Verify → status `verified` | | |
| 7.11 | Issuer Verify চাপলে error / বাটন নেই | | |

---

## 8. TC detail / QR / Print (`/tc/[id]`)
| # | Check | Result | Notes |
|---|---|---|---|
| 8.1 | লিস্ট থেকে TC নম্বরে ক্লিক → detail | | |
| 8.2 | Issuer / Receiver নাম, line items, total সঠিক | | |
| 8.3 | QR কোড দেখায় | | |
| 8.4 | Print / Save PDF → print dialog (sidebar লুকানো) | | |
| 8.5 | অন্য unrelated অর্গ detail খুললে 404 | | |
| 8.6 | Issue সাকসেসে “Open certificate” লিঙ্ক কাজ করে | | |

---

## 9. Dashboards
| # | Check | Result | Notes |
|---|---|---|---|
| 9.1 | Home `/` brand → Brand executive overview | | |
| 9.2 | Home `/` supplier → Supplier overview | | |
| 9.3 | `/brand` KPI + suppliers + received TCs | | |
| 9.4 | `/supplier` wallet cards + facilities + issued TCs | | |
| 9.5 | Auditor home compact workspace (যদি তৈরি করেন) | | |

---

## 10. Security / RLS smoke
| # | Check | Result | Notes |
|---|---|---|---|
| 10.1 | Brand A supplier-এর wallet দেখতে পারে না | | |
| 10.2 | Brand A অন্য brand-এর TC verify করতে পারে না | | |
| 10.3 | Soft isolation: শুধু নিজের / linked ডেটা | | |

---

## 11. Alerts & Orders (new)
| # | Check | Result | Notes |
|---|---|---|---|
| 11.1 | TC issue → receiver `/alerts` এ notification | | |
| 11.2 | Header 🔔 badge unread count আপডেট | | |
| 11.3 | Mark read / Mark all read | | |
| 11.4 | Open লিঙ্ক → TC detail | | |
| 11.5 | Brand `/orders` → linked supplier-এ PO create | | |
| 11.6 | Supplier `/orders` এ incoming order দেখায় | | |
| 11.7 | Wallet mass-balance strip (received/issued/available) | | |
| 11.8 | Low balance (<100 KG) warning | | |
| 11.9 | Sidebar Risk Hub / Compliance → real pages (coming soon নয়) | | |
| 11.10 | `/materials` catalog লিস্ট | | |
| 11.11 | `/membership` invite create + pending লিস্ট | | |
| 11.12 | TC issue-এ optional linked order | | |

---

## 12. Supply Chain Map (`/supply-chain`)
| # | Check | Result | Notes |
|---|---|---|---|
| 12.1 | Brand: linked suppliers tier nodes দেখায় (→ brand) | | |
| 12.2 | Supplier: নিজের facilities chain দেখায় | | |
| 12.3 | Latest TC badge (যদি inbound TC থাকে) | | |
| 12.4 | Manage facilities লিঙ্ক কাজ করে | | |
| 12.5 | Sidebar “Supply Chain” → এই পেজ (Facilities আলাদা) | | |

---

## 13. Reports (`/reports`)
| # | Check | Result | Notes |
|---|---|---|---|
| 13.1 | Wallet + TC + Orders সামারি দেখায় | | |
| 13.2 | Print / Save PDF → sidebar লুকানো | | |
| 13.3 | Brand KPI “Active orders” / “Open alerts” লাইভ সংখ্যা | | |

---

## 14. Membership invite accept
| # | Check | Result | Notes |
|---|---|---|---|
| 14.1 | `/membership` → invite create | | |
| 14.2 | Pending টেবিলে `/invite/…` লিঙ্ক | | |
| 14.3 | অন্য অ্যাকাউন্ট (invited email) দিয়ে Accept & join | | |
| 14.4 | Join পর org dashboard খোলে | | |
| 14.5 | ভুল email / অন্য org ইউজার → reject/error | | |

---

## 15. Digital Product Passport (Phase 2.1)
| # | Check | Result | Notes |
|---|---|---|---|
| 15.1 | `/dpp` → draft passport create | | |
| 15.2 | `/dpp/[id]` detail দেখায় composition / journey / metrics | | |
| 15.3 | **Publish DPP** → status `published` | | |
| 15.4 | Public `/p/{id}` লগইন ছাড়া খোলে | | |
| 15.5 | Public পেজে QR + materials + journey | | |
| 15.6 | Draft `/p/{id}` → 404 (unpublished) | | |
| 15.7 | অন্য org-এর passport dashboard-এ দেখা যায় না | | |
| 15.8 | Sidebar “Product Passport” লিঙ্ক | | |

---

## 16. Shipments (Phase 2.2)
| # | Check | Result | Notes |
|---|---|---|---|
| 16.1 | `/shipments` → create (ports, B/L, optional order) | | |
| 16.2 | লিস্টে shipment number + status দেখায় | | |
| 16.3 | `/shipments/[id]` timeline (created event) | | |
| 16.4 | Log **Departed** → status `in_transit` | | |
| 16.5 | Log **Delivered** → status `delivered` + arrival time | | |
| 16.6 | Consignee org (linked partner) shipment দেখতে পারে | | |
| 16.7 | Sidebar “Shipments” লিঙ্ক | | |

---

## 17. Verification & Auditor (Phase 2.3)
| # | Check | Result | Notes |
|---|---|---|---|
| 17.1 | Auditor org onboard (`org_type=auditor`) | | |
| 17.2 | Home `/` → `/auditor` redirect | | |
| 17.3 | Brand `/verification` → request on linked supplier | | |
| 17.4 | VR number `VR-YYYY-#####` | | |
| 17.5 | Supplier `/alerts` এ verification notice | | |
| 17.6 | Auditor marketplace-এ open request দেখায় | | |
| 17.7 | **Claim** → status `in_progress` | | |
| 17.8 | Publish report (pass/fail + score) → `completed` | | |
| 17.9 | Brand `/alerts` এ audit complete notice | | |
| 17.10 | Non-auditor Claim করতে পারে না | | |

---

## 18. Email (Resend) — Step 2.4
| # | Test | Pass | Notes |
|---|---|---|---|
| 18.1 | `RESEND_API_KEY` ছাড়া TC issue → শুধু `/alerts` in-app, অ্যাপ ক্র্যাশ না | | |
| 18.2 | Key সেট + receiver `organizations.email` → TC issued email | | |
| 18.3 | Org email খালি → email skip, in-app থাকে | | |
| 18.4 | Brand verification request → supplier org email (যদি email থাকে) | | |
| 18.5 | Auditor publish report → brand org email | | |
| 18.6 | `/membership` invite → invitee inbox **অথবা** success এ share link (key ছাড়া) | | |
| 18.7 | `/alerts`-এ email sent / failed / skipped নোট দেখা যায় (TC path) | | |
| 18.8 | `.env.example`-এ `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL` আছে | | |

---

## 19. TC hash anchoring — Step 2.5
| # | Test | Pass | Notes |
|---|---|---|---|
| 19.1 | নতুন TC issue → `/tc/[id]` এ **Anchored** badge | | |
| 19.2 | `sha256:…` hash + `STT-ANCHOR-…` tx দেখায় | | |
| 19.3 | **Verify integrity** → “Hash matches” | | |
| 19.4 | Receiver org-ও hash/tx দেখতে পারে | | |
| 19.5 | Legacy (pre-anchor) TC → Not anchored / soft message | | |
| 19.6 | Issue ব্যর্থ না হয় যদি anchor soft-fail (DB error সিমুলেট না করলে OK) | | |

---

## 20. Perf smoke
| # | Test | Pass | Notes |
|---|---|---|---|
| 20.1 | Dashboard `/` লোড — brand/supplier KPIs আসে | | |
| 20.2 | Sidebar navigate (`/tc` ↔ `/orders`) — shell flicker কম | | |
| 20.3 | Table list pages render (server Table) | | |

---

## 21. Risk Hub + Compliance — Step 2.6
| # | Test | Pass | Notes |
|---|---|---|---|
| 21.1 | `/risk` KPI + exception queue (coming soon নয়) | | |
| 21.2 | Unverified inbound/outbound TC → high flag + View → `/tc/…` | | |
| 21.3 | Open verification → flag → `/verification` | | |
| 21.4 | Unverified facility → low flag | | |
| 21.5 | `/compliance` score + compliance tasks + standards labels | | |
| 21.6 | Brand dashboard Risk score + Compliance KPI populated | | |
| 21.7 | Supplier dashboard Compliance tasks / High priority counts | | |
| 21.8 | Empty queue → clear empty state (সব verify/clean থাকলে) | | |

---

## 22. Sustainability — Step 2.7
| # | Test | Pass | Notes |
|---|---|---|---|
| 22.1 | `/sustainability` real page (coming soon নয়) | | |
| 22.2 | KPI: score + CO₂e/water (DPP থাকলে) + published DPP count | | |
| 22.3 | Priorities টেবিল (draft DPP / footprint / facilities / compliance) | | |
| 22.4 | Measured metrics লিস্ট + Source লিঙ্ক | | |
| 22.5 | Framework labels (GRI/CSRD/CDP/TCFD/SASB) | | |
| 22.6 | Brand footer / score-এ sustainability মান দেখা যায় | | |
| 22.7 | DPP ছাড়া org → create-first priority + empty-ish metrics OK | | |

---

## 23. DPP ↔ TC material linking — Step 2.8
| # | Test | Pass | Notes |
|---|---|---|---|
| 23.1 | `/dpp/{id}` → Link material + TC form | | |
| 23.2 | Link save → list shows material + TC number | | |
| 23.3 | Verified TC → “Verified via TC” badge | | |
| 23.4 | Unlink removes row | | |
| 23.5 | Publish → `/p/{id}` এ linked material + TC number | | |
| 23.6 | `/tc/{id}` → Linked product passports দেখায় | | |
| 23.7 | অন্য org-এর draft DPP public লিঙ্ক নয় (শুধু own Open) | | |

---

## 24. TC ↔ Shipment linking — Step 2.9
| # | Test | Pass | Notes |
|---|---|---|---|
| 24.1 | `/tc` Issue form-এ Linked shipment dropdown (shipment থাকলে) | | |
| 24.2 | Issue with shipment → `/tc/{id}` এ shipment badge/link | | |
| 24.3 | Issuer `/tc/{id}` থেকে Update link / None | | |
| 24.4 | Non-issuer link form দেখে না | | |
| 24.5 | `/shipments/{id}` → Linked TCs লিস্ট | | |
| 24.6 | অন্য org-এর shipment select করলে error | | |

---

## 25. DPP batch / unit QR — Step 2.10
| # | Test | Pass | Notes |
|---|---|---|---|
| 25.1 | Publish DPP → product QR দেখা যায় | | |
| 25.2 | Create Batch QR → list + image | | |
| 25.3 | Create Unit QR → list + image | | |
| 25.4 | Open `/p/{id}?type=batch&code=…` → batch badge | | |
| 25.5 | Duplicate same type+code → error | | |
| 25.6 | Draft passport-এ variant create ব্লক | | |

---

## 26. Not in this build (skip / later)
| # | Item | Status |
|---|---|---|
| 26.1 | Vercel production deploy | Step 2.11 / ops |
| 26.2 | Hyperledger Fabric writer | Needs network |
| 26.3 | Scope 1/2/3 + SBTi wizard | Later |
| 26.4 | Framework PDF/XBRL generators | Later |
| 26.5 | Regulations library + evidence vault | Later |
| 26.6 | Persist risk acknowledge/snooze | Later |
| 26.7 | Carrier/GPS shipment ingest | Later |
| 26.8 | Verification bidding marketplace | Later |
| 26.9 | Resend production domain verify | Ops |

---

## Session log
| Date | Tester | Overall | Critical bugs |
|---|---|---|---|
| ________ | ________ | Pass / Fail | ________ |

### Bug dump
1. 
2. 
3. 

---

## Quick path (৭০ মিনিট)
1. Register supplier + brand (+ optional auditor)  
2. Facility + wallet credit  
3. Link supplier → supply-chain map  
4. Create shipment → TC issue **with shipment** → Anchored → verify  
5. `/risk` + `/compliance` + `/sustainability` check  
6. DPP → link material + TC → publish → **batch/unit QR** → `/p/{id}?type=…`  
7. Shipments events → Delivered; Linked TCs  
8. Brand verification → auditor claim → report  
9. (ঐচ্ছিক) Membership invite / Resend email  

বিস্তারিত স্ক্রিপ্ট: `docs/PILOT_TEST_GUIDE.md`
