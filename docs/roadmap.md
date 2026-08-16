# 🗺️ Roadmap: Better Finance v2

> **File ini = peta arah produk.** Sumber tunggal visi + status fitur + next up.
> Diperbarui: 2026-08-16 · Fase: **P3 aktif + Landing page di-plan.** MVP ✅ · P2 ✅ · Sisa: bf-z6w → bf-3ai → bf-6rl → bf-ayj → bf-dac → bf-uaw + bf-3mb (landing).

---

## 🔜 Kerjaan Aktif — Urut Prioritas

> **Ini satu-satunya tabel yang perlu dibaca buat "kerjakan apa selanjutnya".**
> Plan + prompt siap di `docs/plans/` + `docs/prompts/`. Kerjakan dari atas.

| # | Issue | Fitur | Files | Catatan |
|---|---|---|---|---|
| 1 | `bf-z6w` | Investment grouping 2-level (Reksadana/Saham/USD) | 7 | migration ✅ · **sebelum bf-3ai** |
| 2 | `bf-3ai` | Investment Tracker: current value + P&L | 7 | migration ✅ · depends bf-z6w |
| 3 | `bf-6rl` | Goal account linkage: "disimpan di X" + pre-fill transfer | 7 | migration ✅ |
| 4 | `bf-ayj` | budget_period: pisah tanggal transaksi dari alokasi bulan | 5 | migration ✅ |
| 5 | `bf-dac` | Account detail: klik akun → list transaksi | 5 | — |
| 6 | `bf-uaw` | Sort order akun: ▲▼ reorder di /accounts | 3 | — |
| 7 | `bf-3mb` | Landing page: net worth positioning, "Ink & Paper" visual | ~15 | plan ✅ · prompt ✅ · Mode A (Antigravity) |

### 📦 Parkiran (ter-capture, belum di-plan)

| Issue | Fitur | Catatan |
|---|---|---|
| bf-noo | Import budget historis | — |
| bf-4m1 | Import 2025 (AKTIVA/PASIVA, interaktif) | — |
| bf-aq8 | Breakdown produk investasi: sub-produk per akun | depends bf-z6w |
| bf-kvk | Goal reality check: SUM(collected) ≈ saldo | — |
| bf-9vf | Settings profil + privacy persistence | — |
| bf-gv5 | CFP analysis + insights | butuh data dulu |
| bf-bp5 | Global i18n pass | English-first + multi-bahasa |
| bf-alx | Rename /assets → /net-worth | kosmetik |
| bf-qxb | UI kit lengkap (Toast, DatePicker, dll) | on-demand |
| bf-lp4 | cursor-pointer polish global | batch Phase 5 |

---

## ✅ Selesai — Perjalanan Aplikasi

> Arsip kronologis. Buat referensi — bukan "kerjakan apa" (itu tabel atas).

### Phase 1–3 — Fondasi

- [x] Scaffold Next.js 16 + React 19 + TS strict + Tailwind v4
- [x] Supabase auth 3-tier (client/server/proxy) + signin/signup + auth callback
- [x] 11 tabel schema.ts + Drizzle + balance atomic RPC + IDOR patch (bf-ay8)
- [x] Dashboard read-only + accounts preview + privacy toggle (Zustand)

### Phase 4 Core — Feature Parity v1

- [x] Dashboard, Accounts (CRUD + balancing + wallet denominations)
- [x] Transactions (list, filter, CRUD, transfer, soft-delete)
- [x] Budgets monthly (CRUD + progress bar) + weekly cascade (bf-9qc)
- [x] Goals (CRUD + goal_id + collected derived — bf-4ln)
- [x] Net Worth layout v1 (kartu Accounts agregat + non-liquid per akun — bf-9v5)
- [x] Wishlist (CRUD + promote→goal + affordability — bf-ez2)
- [x] UI kit minimal (Button, Input, Select, MultiSelect, SingleSelect)

### MVP — Jalur ke Migrasi Data

- [x] `bf-yts` — Akun non-liquid + transfer 2-field + goal collected derived + Net Worth non-liquid
- [x] `bf-wrp` — Kategori management (add/edit/soft-delete, `/budgets/categories`)
- [x] `bf-bwh` — 🎯 **MVP selesai.** Import 2026: 2504 tx, 11/11 saldo match. Script `scripts/migrate-sheet.ts`

### Post-MVP Batch P2

- [x] `bf-3e0` — AR/AP liability: is_liability flag, AP kurangi net worth, section Liabilities di /assets
- [x] `bf-4z1` — Income budget: section Budget Earning di halaman budget
- [x] `bf-btz` — Goal usage ledger: spending ber-goal_id kurangi collected, GoalLedger component
- [x] `bf-z8z` — Budget drill-down: tap kategori → list transaksi
- [x] `bf-i6e` — Budget Transfers: 2 aggregate bucket Saving/Investing

---

## 📅 Timeline

| Tanggal | Milestone | Catatan |
|---|---|---|
| 2026-07-22 | Phase 4 core selesai | Semua fitur utama + P1 bugs closed |
| 2026-07-23–25 | bf-yts + bf-wrp | Non-liquid, kategori management |
| 2026-08-11 | **bf-bwh — MVP ✅** | 2504 tx 2026 imported, 11/11 saldo match |
| 2026-08-11 | P2 batch selesai | bf-3e0, bf-4z1, bf-btz, bf-z8z, bf-i6e — 5 issue 1 hari |
| 2026-08-11 | P3 planned | 8 issue di-plan+beads+prompt, 4 migration applied via MCP |
| 2026-08-12 | P3 aktif | bf-z6w next |

---

## 🗂️ Manajemen Sesi (Claude)

Eksekusi kode = Antigravity. Claude = plan + review + diskusi. Sesi dikelompokkan by **tipe kerja**.

| Tipe sesi | Untuk | Naming | Batch |
|---|---|---|---|
| **plan** | Diskusi ide + bikin beads + plan + prompt | `bf-<id> plan-<slug>` | ✅ banyak plan/sesi |
| **review** | Review hasil Antigravity → fix → close → commit | `bf-<id> review-<slug>` | ✅ 2-4 issue kecil |
| **bugfix** | Debug error/regresi runtime | `bf-<id> bugfix-<slug>` | ❌ fokus 1 |
| **discuss** | Diskusi global / roadmap / arah produk | `bf discuss-<topik>` | — |

**Alur per issue:** Antigravity eksekusi (paste prompt) → sesi Claude baru → review → commit → `bd close`.

---

## 📊 Status Fitur

Legenda: ✅ done · 🔄 sebagian · ⏳ belum

| Fitur | Status | Route | Catatan |
|---|---|---|---|
| Scaffold + config | ✅ | — | Next 16 + Drizzle + TanStack + Supabase auth |
| Auth (signin/signup) | ✅ | `/signin`, `/signup` | Server Actions + `useActionState` |
| Dashboard | ✅ | `/dashboard` | Summary cards + accounts preview + privacy toggle (pindah dari `/` untuk landing) |
| Accounts — list + CRUD | ✅ | `/accounts` | Bottom sheet create/edit/delete; balance auto-update |
| Accounts — balancing | ✅ | `/accounts/[id]` | Reality check + wallet denominations |
| Transactions — list + filter | ✅ | `/transactions` | Grouped by date, month+year picker, filter panel |
| Transactions — CRUD + transfer | ✅ | `/transactions` | Balance reversal on edit/delete; transfer 2-field |
| Budgets — monthly | ✅ | `/budgets` | CRUD + progress bar |
| Budgets — weekly cascade | ✅ | `/budgets/weekly` | Cascade algorithm (bf-9qc) |
| Budgets — kategori management | ✅ | `/budgets/categories` | Add/edit/soft-delete, custom group (bf-wrp) |
| Budgets — drill-down + transfers | ✅ | `/budgets` | Tap kategori → transaksi; Saving/Investing aggregate (bf-z8z, bf-i6e) |
| Goals — CRUD + integrasi | ✅ | `/goals` | goal_id di transaksi, collected derived (bf-4ln) |
| Goals — usage ledger | ✅ | `/goals` | Spending ber-goal_id, GoalLedger component (bf-btz) |
| Net Worth | ✅ | `/assets` | Kartu Accounts agregat + non-liquid + Liabilities section (bf-9v5, bf-3e0) |
| Wishlist | ✅ | `/wishlist` | CRUD + promote→goal + affordability (bf-ez2) |
| UI kit — minimal | ✅ | `src/components/ui/` | Button, Input, Select, MultiSelect, SingleSelect |
| UI kit — lengkap | 🔄 | `src/components/ui/` | ConfirmDialog ✅; sisa: Toast, DatePicker, dll (bf-qxb) |
| Akun non-liquid | ✅ | `/accounts` → `/assets` | Enum liquid/investment, redirect ke /assets (bf-yts) |
| Investment grouping | ⏳ | `/assets` | 2-level group + tracker P&L (bf-z6w, bf-3ai) |
| Goal account linkage | ⏳ | `/goals` | "disimpan di X" + pre-fill transfer (bf-6rl) |
| Account detail | ⏳ | `/accounts/[id]` | Klik akun → list transaksi (bf-dac) |
| Settings | ⏳ | `/settings` | Profil, theme, privacy (bf-9vf) |
| Landing page | ⏳ | `/` (publik) | Persona: perencana serius · diferensiasi: net worth utuh · CTA: gratis → signup (bf-3mb) |
| PWA | 🔄 | — | Manifest + globals ada; service worker belum |
| Tests | 🔄 | — | Vitest unit: calcUpdateDeltas ✅; Playwright E2E belum |

---

## 🎯 Visi

**Better Finance v2** = aplikasi tracking keuangan pribadi mobile-first (PWA), penerus v1 (Google Sheets read-only). Multi-user via Supabase, read+write, siap dikomersilkan (tier free/pro/family).

Target: akun, transaksi, budget bulanan+mingguan, goals, aset. AI insights & subscription disiapkan di schema, diaktifkan nanti.

---

## 🛠️ Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript strict |
| Auth | `@supabase/ssr` (client/server/proxy 3-tier) |
| Data layer | Server Actions + Drizzle (query di server → tekan egress) |
| Server state | TanStack Query v5 (`refetchOnWindowFocus: false`) |
| UI state | Zustand (theme, privacy) |
| Styling | Tailwind v4 (mobile-first, `max-w-md`, bottom nav) |
| DB | Supabase Postgres 17 |
| Test | Vitest + Playwright |

> Schema: 11 tabel di `src/db/schema.ts`. Fitur baru = query + UI, tidak perlu migrasi schema baru (kecuali tercatat di issue).

---

## 📜 Changelog

- **2026-08-16** — Planning bf-3mb: landing page net-worth positioning. Plan + prompt + beads di-create. Positioning: persona=individu perencana serius, diferensiasi=net worth utuh, visual=Ink & Paper (biru/indigo), harga=gratis dulu, signature=NetWorthDemo interaktif. Dashboard dipindah `/` → `/dashboard`. Siap eksekusi Antigravity.
- **2026-08-12** — Roadmap update: tambah Timeline, parkiran jadi tabel terstruktur, hapus duplikat changelog, Status Fitur sinkron P2+P3.
- **2026-08-11** — bf-yz4 redesign jadi 2 issue: bf-i6e (Budget Transfers aggregate Saving/Investing) + bf-z8z (budget drill-down). bf-i6e + bf-z8z closed. bf-noo + bf-4m1 turun ke Parkiran.
- **2026-08-11** — P3 planning batch: 8 issue di-plan+beads+prompt (bf-dac, bf-uaw, bf-6rl, bf-ayj, bf-z6w, bf-3ai, bf-noo, bf-4m1). 4 migration applied via MCP (savings_goals.account_id, transactions.budget_period, accounts.investment_group, accounts.current_value+last_valued_at). schema.ts sinkron.
- **2026-08-11** — P2 batch selesai: bf-3e0 (AR/AP liability), bf-4z1 (income budget), bf-btz (goal usage ledger) closed.
- **2026-08-11** — **bf-bwh closed — MVP selesai.** Import 2026: 2504 tx, 11/11 saldo match. AR/AP jadi akun transfer. Issue spin-off: bf-3e0, bf-dac, bf-ayj, bf-z6w, bf-3ai, bf-noo, bf-uaw. bf-13t deferred → digantikan bf-3e0.
- **2026-08-10** — Restruktur roadmap format oims. Hook git-reminder dimatikan (looping token). bf-wrp closed di beads.
- **2026-07-25** — bf-wrp done. Kategori management `/budgets/categories` (add/edit/soft-delete, custom group, slug unique).
- **2026-07-24** — bf-yts done. Akun non-liquid (enum liquid/investment), transfer 2-field, goal collected LEFT JOIN fix, /accounts liquid-only, SingleSelect, enum 4→2.
- **2026-07-23** — bf-ez2, bf-9v5, bf-4ln done. Wishlist affordability, Net Worth layout v1, goal_id + collected derived.
- **2026-07-22** — Phase 4 core selesai. P1 bugs all closed (auth callback, balance atomic RPC, zod validation, calcUpdateDeltas tests).
