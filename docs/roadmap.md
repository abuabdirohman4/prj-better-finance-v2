# 🗺️ Roadmap: Better Finance v2

> **File ini = peta arah produk.** Sumber tunggal visi + status fitur + next up.
> Diperbarui: 2026-08-11 · Fase: **MVP selesai — dogfood aktif.** 🎯 ~~bf-yts~~ ✅ → ~~bf-wrp~~ ✅ → ~~bf-bwh~~ ✅. Data 2026 masuk (2504 tx, 11/11 saldo ✅). Next: P2 batch (bf-3e0, bf-4z1, bf-btz, bf-yz4) — semua siap Antigravity.

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
| ✅ | ~~bf-bwh~~ | 🎯 **MVP selesai.** Import 2026: 2504 tx, 11/11 saldo match. Script . Import 2025 deferred. | ✅ closed |

### Post-MVP — NANTI (fitur, bukan blocker migrasi)

| Issue | Fitur | Catatan |
|---|---|---|
| bf-3e0 | AR/AP liability proper (gantikan bf-13t) | is_liability flag, AP kurangi net worth |
| bf-4z1 | income budget | planning pemasukan |
| bf-btz | goal usage ledger | spend-down + history per goal |
| bf-yz4 | budget saving/transfer | target nabung per goal |
| bf-aq8 | breakdown produk investasi | sub-produk per akun non-liquid |
| bf-kvk | goal reality check | SUM(collected) ≈ saldo |
| bf-dac | account detail page | klik akun → transaksi |
| bf-ayj | budget_period | alokasi gaji ke bulan tujuan |
| bf-z6w | investment grouping 2-level | Reksadana/Saham/USD |
| bf-3ai | investment tracker | current value + P&L |
| bf-noo | import budget historis | dari sheet tab Spending/Earning |
| bf-uaw | sort order akun | drag-and-drop reorder |
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

### ✅ BERIKUTNYA — Migrasi Data (MVP final) — SELESAI

- [x] `bf-bwh` — **Import 2026 done.** 2504 tx, 11/11 saldo ✅. Script `scripts/migrate-sheet.ts`. Import 2025 deferred (format beda).

### 🔜 P2 — Siap Eksekusi Antigravity

Plan + prompt tersedia di `docs/plans/` + `docs/prompts/`. Kerjakan berurutan (bf-3e0 dulu, bf-4z1 + bf-yz4 bisa paralel setelah itu, bf-btz terakhir atau paralel dengan bf-4z1).

| Issue | Fitur | Files | Status |
|---|---|---|---|
| `bf-3e0` | AR/AP liability: `is_liability` flag, AP kurangi net worth, keluar dari /accounts | 8 | ⏳ |
| `bf-4z1` | Income budget: sisi pemasukan di halaman budget | 6 | ⏳ |
| `bf-btz` | Goal usage ledger: spend-down + history per goal, spending ber-goal_id | 5 | ⏳ |
| `bf-yz4` | Budget saving: target nabung per goal (pakai monthly_contribution) | 6 | ⏳ |

### 📦 Post-MVP — Fitur Lanjutan

**P2 (prioritas tinggi) — sudah di-plan di atas ↑**

**P3 (fitur lanjutan dari import):**
- [ ] `bf-dac` — Account detail page: klik akun → list transaksi (filter by account_id OR to_account_id)
- [ ] `bf-ayj` — budget_period: pisah transaction_date dari alokasi bulan (source_month sudah ada)
- [ ] `bf-z6w` — Investment grouping 2-level: Reksadana/Saham/USD sebagai grup → produk
- [ ] `bf-3ai` — Investment Tracker: current value, P&L, modal vs nilai pasar per produk
- [ ] `bf-noo` — Import budget historis dari sheet (Spending/Earning/Transfer/SpendingTF)
- [ ] `bf-uaw` — Sort order akun: drag-and-drop reorder di /accounts dan /assets
- [ ] Import 2025 — SHEET_ID `18iigYTz2ked8bobH1CWGY2sDC-efuNsHjBhEYzdGZqM`, format beda (extra header AKTIVA/PASIVA)

**Parkiran:**
- [ ] `bf-9vf` — Settings profil + privacy persistence
- [ ] `bf-gv5` — CFP analysis + insights (butuh data historis dulu)
- [ ] `bf-bp5` — Global i18n pass
- [ ] `bf-qxb` — UI kit lengkap on-demand
- [ ] `bf-lp4` — UI polish cursor-pointer batch
- [ ] `bf-alx` — Rename /assets → /net-worth

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

- **2026-08-11** — Planning P2 batch: 4 issue di-plan+beads+prompt (bf-3e0, bf-4z1, bf-btz, bf-yz4). bf-3e0: AR/AP liability (8 files), bf-4z1: income budget (6 files), bf-btz: goal usage ledger (5 files), bf-yz4: budget saving (6 files). Semua siap eksekusi Antigravity.
- **2026-08-11** — bf-bwh closed (MVP selesai). Data 2026: 2504 tx, 11/11 saldo match, AR/AP jadi akun transfer. Issue baru: bf-3e0 (liability), bf-dac (account detail), bf-ayj (budget_period), bf-z6w (investment grouping), bf-3ai (tracker), bf-noo (budget import), bf-uaw (sort order). bf-13t deferred (digantikan bf-3e0).
- **2026-08-11** — bf-bwh closed (MVP selesai). Data 2026: 2504 tx, 11/11 saldo ✅, AR/AP jadi akun transfer proper. Issue baru dari sesi: bf-3e0 (liability), bf-dac (account detail), bf-ayj (budget_period), bf-z6w (investment grouping), bf-3ai (tracker), bf-noo (budget import), bf-uaw (sort order). bf-13t deferred → digantikan bf-3e0.
- **2026-08-10** — Restruktur roadmap mengikuti format oims (changelog, timeline, gelombang). Hook git-reminder dimatikan (looping token). bf-wrp closed di beads.
- **2026-07-25** — bf-wrp done. Kategori management `/budgets/categories` (add/edit/soft-delete, custom group, slug unique). roadmap: promote bf-bwh ke next MVP step.
- **2026-07-24** — bf-yts done. Akun non-liquid (enum liquid/investment), transfer 2-field, goal collected LEFT JOIN fix, Net Worth non-liquid render, /accounts liquid-only, SingleSelect, enum 4→2. Follow-up: bf-alx, bf-7m3.
- **2026-07-23** — bf-ez2 done. Wishlist CRUD + promote→goal + affordability free-cash (liquid − Σ goal aktif) + breakdown tooltip. bf-9v5 done. Net Worth layout v1, kartu Accounts agregat + non-liquid per akun. bf-4ln done. goal_id di transaksi, collected derived.
- **2026-07-22** — Phase 4 core selesai: Accounts, Transactions, Budgets monthly+weekly, Goals, UI kit minimal. P1 bugs all closed (auth callback, balance atomic RPC, zod validation, calcUpdateDeltas tests).
