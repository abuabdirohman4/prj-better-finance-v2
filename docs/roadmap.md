# 🗺️ Roadmap: Better Finance v2

> **File ini = peta arah produk.** Sumber tunggal visi + status fitur + next up.
> Diperbarui: 2026-08-10 · Fase: **Phase 4 aktif**. **🎯 MVP = dogfood: pindah dari Google Sheet.** Jalur: ~~bf-yts~~ ✅ → ~~bf-wrp~~ ✅ → **bf-bwh (migrasi data)**. Sisanya Post-MVP.

---

## 🎯 MVP & Post-MVP

> **Definisi MVP:** app cukup buat GANTI Google Sheet — dogfood harian.
> Aturan pilah: *"issue ini nampung DATA sheet, atau nambah FITUR baru?"* → nampung data = MVP, fitur baru = nanti.

### MVP — SEKARANG (jalur ke migrasi)

Urut. Tujuan akhir = **bf-bwh migrasi data sheet** berjalan mulus.

| # | Issue | Kenapa MVP | Status |
|---|---|---|---|
| ✅ | ~~bf-yts~~ | Akun non-liquid + transfer 2-field + goal collected derived + Net Worth non-liquid. **DONE.** | ✅ closed |
| ✅ | ~~bf-wrp~~ | Kategori management (add/edit/soft-delete dari `/budgets/categories`). **DONE.** | ✅ closed |
| 3 | **bf-bwh** | 🎯 **Tujuan MVP.** Import data sheet 2025-2026. Aman setelah kategori siap. | ✅ prompt siap |

### Post-MVP — NANTI (fitur, bukan blocker migrasi)

| Issue | Fitur | Catatan |
|---|---|---|
| bf-13t | AP/AR utang/piutang | fitur unggulan, brainstorm dulu |
| bf-4z1 | income budget | planning pemasukan |
| bf-btz | goal usage ledger | spend-down + history per goal |
| bf-yz4 | budget saving/transfer | target nabung per goal |
| bf-aq8 | breakdown produk investasi | sub-produk per akun non-liquid |
| bf-kvk | goal reality check | SUM(collected) ≈ saldo |
| bf-9vf | settings + privacy | shell |
| bf-gv5 | CFP analysis + insights | butuh data dulu |
| bf-bp5 | global i18n pass | English-first + multi-bahasa |
| bf-alx | rename /assets → /net-worth | kosmetik |
| bf-qxb / bf-lp4 | UI kit lengkap / cursor polish | on-demand / batch Phase 5 |

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

## 🔜 Next Up — Urutan Eksekusi

Plan + prompt siap di `docs/plans/` + `docs/prompts/`. Kerjakan berurutan.

### ✅ Phase 4 Core — Feature Parity v1 — SELESAI

- [x] Dashboard — wire ke data real
- [x] Accounts — list, CRUD, balancing, wallet denominations
- [x] Transactions — list, filter, CRUD, transfer, soft-delete
- [x] Budgets — monthly CRUD + progress bar (bf-n43) + weekly cascade (bf-9qc)
- [x] Goals — CRUD, integrasi goal_id, collected derived (bf-4ln)
- [x] Net Worth — layout v1, kartu Accounts agregat + non-liquid per akun (bf-9v5)
- [x] Wishlist — CRUD, promote→goal, affordability free-cash (bf-ez2)
- [x] Akun non-liquid + transfer 2-field + enum shrink (bf-yts)
- [x] **Kategori management** — add/edit/soft-delete, `/budgets/categories` (bf-wrp) ✅

### 🔜 BERIKUTNYA — Migrasi Data (MVP final)

- [ ] `bf-bwh` — **Import data sheet 2025-2026** (prompt siap di `docs/prompts/2026-07-23-bf-bwh-*`)

### 📦 Post-MVP — Fitur Lanjutan

- [ ] `bf-13t` — AP/AR utang/piutang (brainstorm dulu — schema + integrasi Net Worth)
- [ ] `bf-9vf` — Settings profil + privacy persistence (prompt: `2026-07-22-bf-9vf-*`)
- [ ] `bf-gv5` — CFP analysis + insights (prompt: `2026-07-23-bf-gv5-*`)
- [ ] `bf-bp5` — Global i18n pass (prompt: `2026-07-23-bf-bp5-*`)
- [ ] `bf-qxb` — UI kit lengkap on-demand (prompt: `2026-07-22-bf-qxb-*`)
- [ ] `bf-lp4` — UI polish cursor-pointer batch (prompt: `2026-07-23-bf-lp4-*`)

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

- **2026-08-10** — Restruktur roadmap mengikuti format oims (changelog, timeline, gelombang). Hook git-reminder dimatikan (looping token). bf-wrp closed di beads.
- **2026-07-25** — bf-wrp done. Kategori management `/budgets/categories` (add/edit/soft-delete, custom group, slug unique). roadmap: promote bf-bwh ke next MVP step.
- **2026-07-24** — bf-yts done. Akun non-liquid (enum liquid/investment), transfer 2-field, goal collected LEFT JOIN fix, Net Worth non-liquid render, /accounts liquid-only, SingleSelect, enum 4→2. Follow-up: bf-alx, bf-7m3.
- **2026-07-23** — bf-ez2 done. Wishlist CRUD + promote→goal + affordability free-cash (liquid − Σ goal aktif) + breakdown tooltip. bf-9v5 done. Net Worth layout v1, kartu Accounts agregat + non-liquid per akun. bf-4ln done. goal_id di transaksi, collected derived.
- **2026-07-22** — Phase 4 core selesai: Accounts, Transactions, Budgets monthly+weekly, Goals, UI kit minimal. P1 bugs all closed (auth callback, balance atomic RPC, zod validation, calcUpdateDeltas tests).
