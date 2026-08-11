# 🗺️ Roadmap: Better Finance v2

> **File ini = peta arah produk.** Sumber tunggal visi + status fitur + next up.
> Diperbarui: 2026-08-11 · Fase: **P2 + P3 berjalan.** ~~bf-3e0~~ ✅ ~~bf-4z1~~ ✅ ~~bf-btz~~ ✅ ~~bf-yz4/i6e/z8z~~ ✅. Next: P3 (bf-z6w, bf-3ai, bf-6rl, bf-ayj, bf-dac, bf-uaw).

---

## 🔜 Kerjaan Aktif — Urut Prioritas

> **Ini satu-satunya tabel yang perlu dibaca buat "kerjakan apa selanjutnya".**
> Plan + prompt siap di `docs/plans/` + `docs/prompts/`. Kerjakan dari atas.

| # | Issue | Fitur | Files | Catatan |
|---|---|---|---|---|
| 1 | ~~`bf-z8z`~~ | Budget drill-down: tap kategori → list transaksi | 6 | ✅ |
| 2 | ~~`bf-i6e`~~ | Budget Transfers: 2 aggregate bucket Saving/Investing | 6 | ✅ |
| 3 | `bf-z6w` | Investment grouping 2-level (Reksadana/Saham/USD) | 7 | migration ✅ · **sebelum bf-3ai** |
| 4 | `bf-3ai` | Investment Tracker: current value + P&L | 7 | migration ✅ · depends bf-z6w |
| 5 | `bf-6rl` | Goal account linkage: "disimpan di X" + pre-fill transfer | 7 | migration ✅ |
| 6 | `bf-ayj` | budget_period: pisah tanggal transaksi dari alokasi bulan | 5 | migration ✅ |
| 7 | `bf-dac` | Account detail: klik akun → list transaksi | 5 | — |
| 8 | `bf-uaw` | Sort order akun: ▲▼ reorder di /accounts | 3 | — |

**Parkiran** (ter-capture, belum di-plan, tanpa komitmen waktu):
`bf-noo` import budget historis · `bf-4m1` import 2025 (AKTIVA/PASIVA, interaktif) · `bf-aq8` breakdown produk investasi · `bf-kvk` goal reality check · `bf-9vf` settings+privacy · `bf-gv5` CFP insights (butuh data) · `bf-bp5` i18n pass · `bf-alx` rename /assets→/net-worth · `bf-qxb` UI kit lengkap · `bf-lp4` cursor polish

---

## ✅ Selesai — Perjalanan Aplikasi

> Arsip kronologis progress dari awal. Tidak perlu dibaca buat "kerjakan apa" (itu di tabel atas) — ini dokumentasi perjalanan.

### Phase 1 — Fondasi (scaffold + auth)

- [x] Scaffold Next.js 16 + React 19 + TS strict + Tailwind v4
- [x] Supabase auth 3-tier (client/server/proxy) + signin/signup Server Actions
- [x] Access control + user profile management + auth callback route (email verify)

### Phase 2 — Schema DB

- [x] 11 tabel di `src/db/schema.ts` (accounts, transactions, categories, budgets, savings_goals, wishlists, wallet_denominations, account_balance_snapshots, ai_insights, dst)
- [x] Drizzle setup + query layer pattern (filter user_id manual, no RLS)
- [x] Balance mutation atomic via Postgres RPC `apply_transaction_balances` + IDOR patch (bf-ay8)

### Phase 3 — Read-Only Awal

- [x] Dashboard read-only (summary cards + accounts preview)
- [x] Accounts list read-only + privacy toggle (Zustand)

### Phase 4 Core — Feature Parity v1 (read+write)

- [x] Dashboard — wire ke data real
- [x] Accounts — list, CRUD, balancing, wallet denominations
- [x] Transactions — list, filter, CRUD, transfer, soft-delete
- [x] Budgets — monthly CRUD + progress bar (bf-n43) + weekly cascade (bf-9qc)
- [x] Goals — CRUD, integrasi goal_id, collected derived (bf-4ln)
- [x] Net Worth — layout v1, kartu Accounts agregat + non-liquid per akun (bf-9v5)
- [x] Wishlist — CRUD, promote→goal, affordability free-cash (bf-ez2)
- [x] UI kit minimal — Button, Input, Select, MultiSelect, SingleSelect

### MVP — Jalur ke Migrasi Data (ganti Google Sheet)

- [x] `bf-yts` — Akun non-liquid + transfer 2-field + goal collected derived + Net Worth non-liquid
- [x] `bf-wrp` — Kategori management (add/edit/soft-delete, `/budgets/categories`)
- [x] `bf-bwh` — 🎯 **MVP selesai.** Import 2026: 2504 tx, 11/11 saldo match. Script `scripts/migrate-sheet.ts`.

### Post-MVP Batch (P2)

- [x] `bf-3e0` — AR/AP liability: is_liability flag, AP kurangi net worth, section Liabilities di /assets
- [x] `bf-4z1` — Income budget: section Budget Earning di halaman budget
- [x] `bf-btz` — Goal usage ledger: spending ber-goal_id kurangi collected, GoalLedger component

> Detail per fitur: tabel **Status Fitur** di bawah. Detail teknis tiap issue: git log + `docs/plans/`.

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
| Dashboard | ✅ | `/` | Summary cards + accounts preview + privacy toggle |
| Accounts — list + CRUD | ✅ | `/accounts` | Bottom sheet create/edit/delete; balance auto-update |
| Accounts — balancing | ✅ | `/accounts/[id]` | Reality check + wallet denominations |
| Transactions — list + filter | ✅ | `/transactions` | Grouped by date, month+year picker, filter panel |
| Transactions — CRUD + transfer | ✅ | `/transactions` | Balance reversal on edit/delete; transfer 2-field |
| Budgets — monthly | ✅ | `/budgets` | CRUD + progress bar |
| Budgets — weekly cascade | ✅ | `/budgets/weekly` | Cascade algorithm (bf-9qc) |
| Budgets — kategori management | ✅ | `/budgets/categories` | Add/edit/soft-delete, custom group (bf-wrp) |
| Goals — CRUD + integrasi | ✅ | `/goals` | goal_id di transaksi, collected derived (bf-4ln) |
| Net Worth | ✅ | `/assets` | Kartu Accounts agregat + non-liquid per akun (bf-9v5) |
| Wishlist | ✅ | `/wishlist` | CRUD + promote→goal + affordability (bf-ez2) |
| UI kit — minimal | ✅ | `src/components/ui/` | Button, Input, Select, MultiSelect, SingleSelect |
| UI kit — lengkap | 🔄 | `src/components/ui/` | ConfirmDialog ✅; sisa: Toast, DatePicker, dll (bf-qxb) |
| Akun non-liquid | ✅ | `/accounts` → `/assets` | Enum liquid/investment, redirect ke /assets (bf-yts) |
| Settings | ⏳ | `/settings` | Profil, theme, privacy (bf-9vf) |
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

> Schema sudah siap: 11 tabel di `src/db/schema.ts` — `budgets`, `savings_goals`, `wishlists`, `wallet_denominations`, `account_balance_snapshots`, `ai_insights`. Fitur baru = query + UI, tidak perlu migrasi schema baru.

---

## 📜 Changelog

- **2026-08-11** — bf-yz4 di-redesign jadi 2 issue terpisah: bf-i6e (Budget Transfers aggregate Saving/Investing, bukan per-goal) + bf-z8z (budget category drill-down: tap kartu → list transaksi). Plan+prompt siap keduanya. bf-noo + bf-4m1 turun ke Parkiran.
- **2026-08-11** — Planning P3 batch: 8 issue di-plan+beads+prompt (bf-dac, bf-uaw, bf-6rl, bf-ayj, bf-z6w, bf-3ai, bf-noo, bf-4m1). bf-4m1 (Import 2025) bead baru. 4 migration di-apply Claude via MCP (savings_goals.account_id, transactions.budget_period, accounts.investment_group, accounts.current_value+last_valued_at) + schema.ts sinkron. Dependency: bf-z6w → bf-3ai. Siap Antigravity (bf-4m1 interaktif).
- **2026-08-11** — bf-yz4/i6e/z8z closed. Saving budget section per-goal, budget drill-down (tap kartu → transaksi list + edit), BudgetCard onTap redesign.
- **2026-08-11** — bf-btz closed. Goal usage ledger: spending ber-goal_id kurangi collected, GoalLedger component, goal picker di TransactionForm spending.
- **2026-08-11** — bf-4z1 closed. Income budget: section Budget Earning di halaman budget, color scheme hijau, filter per group.
- **2026-08-11** — bf-3e0 closed. AR/AP liability: is_liability flag, AP kurangi net worth, section Liabilities di /assets, accounts total exclude liability.
- **2026-08-11** — Planning P2 batch: 4 issue di-plan+beads+prompt (bf-3e0, bf-4z1, bf-btz, bf-yz4). bf-3e0: AR/AP liability (8 files), bf-4z1: income budget (6 files), bf-btz: goal usage ledger (5 files), bf-yz4: budget saving (6 files). Semua siap eksekusi Antigravity.
- **2026-08-11** — bf-bwh closed (MVP selesai). Data 2026: 2504 tx, 11/11 saldo match, AR/AP jadi akun transfer. Issue baru: bf-3e0 (liability), bf-dac (account detail), bf-ayj (budget_period), bf-z6w (investment grouping), bf-3ai (tracker), bf-noo (budget import), bf-uaw (sort order). bf-13t deferred (digantikan bf-3e0).
- **2026-08-11** — bf-bwh closed (MVP selesai). Data 2026: 2504 tx, 11/11 saldo ✅, AR/AP jadi akun transfer proper. Issue baru dari sesi: bf-3e0 (liability), bf-dac (account detail), bf-ayj (budget_period), bf-z6w (investment grouping), bf-3ai (tracker), bf-noo (budget import), bf-uaw (sort order). bf-13t deferred → digantikan bf-3e0.
- **2026-08-10** — Restruktur roadmap mengikuti format oims (changelog, timeline, gelombang). Hook git-reminder dimatikan (looping token). bf-wrp closed di beads.
- **2026-07-25** — bf-wrp done. Kategori management `/budgets/categories` (add/edit/soft-delete, custom group, slug unique). roadmap: promote bf-bwh ke next MVP step.
- **2026-07-24** — bf-yts done. Akun non-liquid (enum liquid/investment), transfer 2-field, goal collected LEFT JOIN fix, Net Worth non-liquid render, /accounts liquid-only, SingleSelect, enum 4→2. Follow-up: bf-alx, bf-7m3.
- **2026-07-23** — bf-ez2 done. Wishlist CRUD + promote→goal + affordability free-cash (liquid − Σ goal aktif) + breakdown tooltip. bf-9v5 done. Net Worth layout v1, kartu Accounts agregat + non-liquid per akun. bf-4ln done. goal_id di transaksi, collected derived.
- **2026-07-22** — Phase 4 core selesai: Accounts, Transactions, Budgets monthly+weekly, Goals, UI kit minimal. P1 bugs all closed (auth callback, balance atomic RPC, zod validation, calcUpdateDeltas tests).
