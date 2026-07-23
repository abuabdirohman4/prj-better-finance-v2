# Roadmap: Better Finance v2

> **File ini = peta arah produk.** Sumber tunggal visi + status fitur + next up.
> Diperbarui: 2026-07-24 · Fase: **Phase 4 aktif**. **🎯 MVP = dogfood: pindah dari Google Sheet.** Jalur: ~~bf-yts~~ ✅ → **bf-wrp (kategori management)** → **bf-bwh (migrasi data)**. Sisanya Post-MVP. Lihat **§MVP & Post-MVP**.

---

## 🎯 MVP & Post-MVP (per 2026-07-23)

> **Definisi MVP: app cukup buat GANTI Google Sheet — dogfood harian.**
> Aturan pilah: *"issue ini nampung DATA sheet, atau nambah FITUR baru?"* → nampung data = MVP, fitur baru = nanti.
> Beads gak bikin kerjaan nambah — dia parkiran ide biar visi ke-capture tanpa dikerjain sekarang. 21 issue udah closed; yang "bengkak" cuma spin-off ide (bagus, terparkir).

### MVP — SEKARANG (jalur ke migrasi)

Urut. Tujuan akhir = **bf-bwh migrasi data sheet** berjalan mulus (tanpa data kacau).

| # | Issue | Kenapa MVP | Status |
|---|---|---|---|
| ✅ | ~~bf-kt2~~ | Fix form kategori campur — **DONE** (closed). | ✅ closed |
| ✅ | ~~bf-yts~~ | Akun non-liquid + transfer 2-field + drop linked_account_id + goal collected derived (LEFT JOIN fix) + Net Worth non-liquid render + /accounts liquid-only + redirect. **DONE** (closed). Follow-up: bf-alx, bf-7m3. | ✅ closed |
| 2 | **bf-wrp** | 🎯 **NEXT.** Migrasi butuh ini: kategori custom sheet gak ada di app → transaksi gagal/masuk Others. | ✅ design (`2026-07-23-bf-wrp-*`) |
| 3 | **bf-bwh** | 🎯 **Tujuan MVP.** Import data sheet 2025-2026. Aman setelah kategori siap. | ✅ prompt (`2026-07-23-bf-bwh-*`) |

### Post-MVP — NANTI (fitur, bukan blocker migrasi)

Semua ini **nambah fitur**, gak nampung data sheet. Sheet tetap jalan sementara. Kerjakan setelah dogfood.

| Issue | Fitur | Catatan |
|---|---|---|
| bf-13t | AP/AR utang/piutang | fitur unggulan, brainstorm dulu |
| bf-4z1 | income budget | planning pemasukan, bukan data |
| bf-btz | goal usage ledger | spend-down + history per goal, anti double-count |
| bf-yz4 | budget saving/transfer | target nabung per goal |
| bf-aq8 | breakdown produk investasi | sub-produk (Saham BCA, Emas cincin); depends bf-yts |
| bf-kvk | goal reality check | pengaman collected ≈ saldo |
| bf-9vf | settings + privacy | shell |
| bf-gv5 | CFP analysis + insights | butuh data dulu |
| bf-bp5 | global i18n pass | English-first + multi-bahasa |
| bf-qxb / bf-lp4 | UI kit lengkap / cursor polish | on-demand / batch Phase 5 |

---

## Visi

**Better Finance v2** = aplikasi tracking keuangan pribadi mobile-first (PWA), penerus Better Finance v1 (Google Sheets read-only). Multi-user dengan Supabase, read+write, siap dikomersilkan (tier free/pro/family).

Target: personal finance — akun, transaksi, budget bulanan+mingguan, goals, aset. AI insights & subscription disiapkan di schema, diaktifkan nanti.

Dibangun ulang untuk: type-safety (TypeScript), minim bug, minim egress cost.

---

## Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript strict |
| Auth/session | `@supabase/ssr` (client/server/proxy 3-tier) |
| Data layer | Server Actions + **Drizzle** (query di server → tekan egress) |
| Server state | TanStack Query v5 (`refetchOnWindowFocus: false`) |
| UI state | Zustand (theme, privacy) |
| Styling | Tailwind v4 (mobile-first, `max-w-md`, bottom nav) |
| UI kit | `src/components/ui/` — Button, Input, Select, MultiSelect (SingleSelect diekspor dari `MultiSelect.tsx`, bukan file terpisah) |
| DB | Supabase Postgres 17 |
| Test | Vitest + Playwright (belum diimplementasi) |

---

## Status Fitur

Legenda: ✅ done · 🔄 sebagian · ⏳ belum

| Fitur | Status | Route | Catatan |
|---|---|---|---|
| Scaffold + config | ✅ | — | Next 16 + Drizzle + TanStack + Supabase auth, build clean |
| Auth (signin/signup) | ✅ | `/signin`, `/signup` | Server Actions + `useActionState` |
| Dashboard / Home | ✅ | `/` | Summary cards + accounts preview + privacy toggle |
| Accounts — list | ✅ | `/accounts` | TanStack Query + account visuals (initials/icon/color) |
| Accounts — CRUD | ✅ | `/accounts` | Bottom sheet create/edit/delete; balance auto-update |
| Accounts — balancing | ✅ | `/accounts/[id]` | Reality check + adjust balance |
| Transactions — list | ✅ | `/transactions` | Grouped by date, inside card, month+year picker di header |
| Transactions — filter | ✅ | `/transactions` | 2-col panel: type/account/category/note, MultiSelect searchable |
| Transactions — CRUD | ✅ | `/transactions` | Bottom sheet create/edit/delete; balance reversal on edit/delete |
| Transactions — transfer | ✅ | `/transactions` | Pisah **Ke Akun** (wajib) + **Untuk Goal** (opsional, tag goal_id). Goal multi-akun via transaksi. bf-yts 🔄 |
| UI kit — minimal | ✅ | `src/components/ui/` | Button, Input, Select, MultiSelect (portal, searchable, groups) + SingleSelect (dari MultiSelect.tsx; dipakai form akun bf-yts). Issue bf-bq8 |
| UI kit — lengkap | 🔄 | `src/components/ui/` | ConfirmDialog ✅ (ganti `window.confirm`). Sisa: Checkbox, Toast/Sonner, DatePicker, Badge, Skeleton, Textarea, Switch. Issue **bf-qxb** (P3, open) |
| UI polish — cursor | ⏳ | seluruh app | `cursor-pointer` di semua clickable (base Button + ~17 file raw). Issue **bf-lp4** (P3, open) |
| Budgets | ✅ | `/budgets`, `/budgets/weekly` | Monthly CRUD + progress bar (bf-n43 ✅); weekly cascade algorithm (bf-9qc ✅) |
| Goals — CRUD | ✅ | `/goals` | Progress, grouped by type, CRUD (bf-73n ✅). **linked_account_id di-DROP** (bf-yts) — goal tak lagi terikat 1 akun; lokasi dana derive dari transaksi |
| Goals — integrasi | ✅ | `/goals` | goal_id di transaksi, collected derived (**bf-4ln** ✅). Transfer tag goal (bf-yts) — 1 goal bisa sebar multi-akun |
| Net Worth | ✅ | `/assets` | Layout v1 — kartu "Accounts" agregat liquid (klik→/accounts) + non-liquid per akun. Non-liquid filter `!== "liquid"` (bf-yts fix). Rename→/net-worth: **bf-alx**. AP/AR nanti (bf-13t). **bf-9v5** ✅ |
| Wallet denominations | ✅ | `/accounts/[id]` | Section di halaman balancing, hanya akun `is_wallet`. Grid pecahan + live total + auto-save reality check. Issue bf-p8w |
| Wishlist | ✅ | `/wishlist` | CRUD + status tabs + promote→goal + affordability (free cash = liquid − goals di akun liquid) + breakdown tooltip. UI English. Issue **bf-ez2** ✅ |
| Settings | ⏳ | `/settings` | Profil, theme, privacy |
| Kategori — management | ⏳ | TBD | **Gap: user TIDAK bisa tambah/edit/hapus kategori** — cuma seed default. Brainstorm dulu (di mana kelola, custom group?). Issue **bf baru** |
| Akun — non-liquid | ✅ | `/accounts` → `/assets` | **Kategori Aset** 2 opsi (Liquid/Investment) via SingleSelect. Non-liquid tak muncul di /accounts (liquid-only), buat dari /accounts → redirect ke /assets. Enum DB shrink 4→2. **bf-yts** ✅ |
| PWA | 🔄 | — | Manifest + globals ada; service worker & install UI belum |
| Tests | 🔄 | — | Vitest unit: calcUpdateDeltas 5 cases ✅ (bf-13q). Playwright E2E belum |

> **Schema sudah siap, fitur belum:** semua tabel sudah ada di `src/db/schema.ts` (11 tabel) — `budgets`, `savings_goals`, `wishlists`, `wallet_denominations`, `account_balance_snapshots`, `ai_insights`. Bangun fitur = tinggal query + UI, tidak perlu migrasi schema baru.

---

## Fase yang Sudah Selesai

### ✅ Phase 1 — Database
- [x] Jalankan SQL schema ke Supabase (11 tabel + triggers + views) — SQL dari `prj-better-finance/plan.md`
- [x] Verifikasi trigger: signup → auto-seed `account_types` + `categories`
- [x] Verifikasi free-tier: insert akun ke-6 gagal (`check_account_limit`)
- [x] `drizzle-kit introspect` sync — `src/db/schema.ts` cocok DB

### ✅ Phase 2 — Auth & shell
- [x] Signin/signup via Server Actions + `useActionState`
- [x] Proxy proteksi route `(app)` — redirect ke `/signin` kalau belum auth
- [x] Auth callback route (`/auth/callback`) — `src/app/auth/callback/route.ts`, `exchangeCodeForSession`, redirect ke `/`. Issue bf-2v2 ✅

### ✅ Phase 3 — Seed dummy data
> Migrasi data asli Sheets → Supabase **ditunda ke Phase 6**. Phase 3 diselesaikan dengan seed dummy supaya fitur (Phase 4) bisa dibangun + diuji tanpa perlu data asli. Setelah semua fitur jadi, baru Phase 6 replace dummy dengan data real dari Sheets.
- [x] Seed dummy accounts (`docs/seed/dummy-accounts.sql`)
- [x] Seed dummy transactions untuk testing tampilan
- [x] Dashboard + accounts list bisa render data real dari DB

### Phase 4 — Fitur inti (feature parity v1)

Per fitur: Drizzle query → Server Action → TanStack hook → page + `_components`.

- [x] Dashboard — wire ke data real ✅
- [x] Accounts — list, CRUD, balancing ✅
- [x] Transactions — list per bulan + filter, CRUD, transfer, soft-delete ✅
- [x] Wallet denominations — section di `/accounts/[id]`, grid pecahan fisik, live total, auto reality check. Issue bf-p8w ✅
- [x] Budgets — monthly CRUD + progress bar (bf-n43 ✅) + weekly cascade (bf-9qc ✅)
- [x] Goals — progress, grouped by type, CRUD (bf-73n ✅)
- [x] Goals integrasi — goal_id + collected derived + transfer UI + akun wajib + ConfirmDialog (bf-4ln ✅)
- [x] Net Worth — layout v1 (kartu Accounts agregat + non-liquid per akun), nama "Net Worth" (bf-9v5 ✅) + rename account types Cash/Bank/E-wallet
- [x] Wishlist — CRUD + promote→goal + affordability free-cash (bf-ez2 ✅)
- [x] Fix kategori transaksi — filter by txType (earning vs spending terpisah di form)
- [x] akun non-liquid + akun goals (fondasi Net Worth non-liquid)
- [ ] Settings — profil user + privacy preference persistence
- [ ] Brainstorm: kategori management (user tambah/edit kategori)

✅ **Semua P1 bugs closed:**
1. ✅ **bf-2v2** — auth callback `/auth/callback`
2. ✅ **bf-ydb** — server-side validation (covered by bf-zrl)
3. ✅ **bf-zrl** — zod schemas + safeParse semua Server Actions
4. ✅ **bf-uk7** — balance atomic via Postgres RPC `apply_transaction_balances`
5. ✅ **bf-13q** — `calcUpdateDeltas` pure function + 5 Vitest cases

**Lanjut fitur Phase 4:** lihat §Urutan Kerja di bawah.

### Phase 5 — Polish + PWA + Tests

- `next-pwa` + service worker + install prompt
- Vitest: helper finansial (formatCurrency, budget color, week calc)
- Playwright: E2E signin → tambah transaksi → cek dashboard update
- UI kit lengkap (**bf-qxb**, P3 open) — sudah dipindah ke tabel Status Fitur di atas; kerjakan on-demand saat fitur baru butuh komponen (mis. DatePicker utk budgets)
- UI polish cursor-pointer (**bf-lp4**, P3 open) — base Button + ~17 file raw clickable. Batch di sini, atau sekalian saat sentuh UI fitur lain

### Phase 6 — Migrasi data v1 → v2 (opsional, belum dikerjakan)

> Beda dari schema migration (Drizzle, `drizzle/*.sql` — sudah ada) & seed dummy (`docs/seed/dummy-accounts.sql` — sudah ada). Ini migrasi **data asli** dari Sheets. `scripts/` belum dibuat.

- Skrip `scripts/migrate.ts` — transform dari Google Sheets export
- Dedup via hash
- Verifikasi total saldo & jumlah transaksi cocok v1

---

---

## Urutan Kerja (per 2026-07-23)

Semua issue di bawah plan + prompt Antigravity SUDAH SIAP (kecuali dicatat belum). Kerjakan berurutan — urutan mempertimbangkan dependency & nilai.

| # | Issue | Fitur | Prio | Kenapa urutan ini | Plan/Prompt |
|---|---|---|---|---|---|
| ✅ | ~~bf-4ln~~ | Goals-transactions integration | P2 | **DONE** (commit c259410) — goal_id + collected derived + transfer grup Akun/Goals + akun wajib + ConfirmDialog. Reality check → follow-up bf-kvk. | closed |
| ✅ | ~~bf-9v5~~ | Net Worth | P2 | **DONE** — layout v1 (kartu Accounts agregat + non-liquid per akun), nama Net Worth, rename account types Cash/Bank/E-wallet. | closed |
| ✅ | ~~bf-ez2~~ | Wishlist + promote→goal | P2 | **DONE** — CRUD + affordability free-cash + promote→goal + tooltip. UI English. | closed |
| ✅ | ~~bf-kt2~~ | Fix kategori transaksi | P2 | **DONE** (closed) — form filter kategori by txType. | closed |
| ✅ | ~~bf-yts~~ | Akun non-liquid + transfer 2-field | P2 | **DONE** (closed). + goal collected LEFT JOIN fix, Net Worth non-liquid render, /accounts liquid-only, SingleSelect, enum 4→2. Follow-up bf-alx/bf-7m3. Design: `2026-07-23-bf-yts-*`. | closed |
| **2** | **bf-wrp** | Kategori management | P2 | 🎯 **NEXT — BRAINSTORM dulu.** User belum bisa tambah/edit/hapus kategori (cuma seed default). Di mana kelola + custom group? Blocker migrasi bf-bwh. | ⏳ brainstorm |
| **4** | **bf-13t** | AP/AR utang/piutang | P2 | Fitur unggulan + fondasi bisnis. **BRAINSTORM desain dulu** (schema, field, integrasi). Tabel terpisah, ikut Net Worth. | ⏳ brainstorm |
| **5** | **bf-9vf** | Settings + privacy | P3 | Melengkapi shell. Ada menu di BottomNav yang di-hide sampai ini jadi. | ✅ `2026-07-22-bf-9vf-*` |
| **6** | **bf-bwh** | Migrasi data 2025-2026 | P3 | Butuh bf-4ln (goal_id) supaya transaksi ter-tag saat import. Setelah app siap. | ✅ `2026-07-23-bf-bwh-*` |
| **7** | **bf-gv5** | CFP analysis + insights | P3 | Butuh data (bisa dari sheet/DB). Mode 1 (chat) bisa sekarang tanpa coding. | ✅ `2026-07-23-bf-gv5-*` |
| — | **bf-bp5** | Global i18n pass | P2 | English-first + siapkan multi-bahasa. Shared `ErrorContext` + sisa Indonesian strings. Tidak berurutan. | ✅ `2026-07-23-bf-bp5-*` |
| — | **bf-qxb** | UI kit lengkap | P3 | On-demand — kerjakan saat fitur butuh komponen baru (mis. DatePicker). Tidak berurutan. | ✅ `2026-07-22-bf-qxb-*` |
| — | **bf-lp4** | UI polish cursor-pointer | P3 | Polish global, bukan blocker. Batch di Phase 5, atau sekalian saat sentuh UI fitur. Tidak berurutan. | ✅ `2026-07-23-bf-lp4-*` |
| — | **bf-kvk** | Goal reality check | P3 | Follow-up bf-4ln scope(5): SUM(collected per akun) ≈ current_balance → warning. Pengaman kalau akun goal gabung liquid biasa. | ⏳ belum |

**Alur per issue:** Antigravity eksekusi (paste prompt) → commit → **sesi Claude BARU** untuk review (`/rename bf-xxx review`). 1 issue = 1 sesi review.

**Prioritas sekarang:** **bf-wrp kategori management** (brainstorm dulu — blocker migrasi) → **bf-bwh migrasi data sheet** (tujuan MVP).

## Ditunda

- AI insights (`ai_insights`) + integrasi model
- Subscription enforcement penuh + Stripe
- Realtime subscriptions
- **AP/AR (utang/piutang)** — tabel terpisah receivables/payables, fitur unggulan + fondasi bisnis/UMKM. Ikut Net Worth (AR+, AP−). Issue **bf-13t** (P2). Konsep: bd memory `assets-networth-apar-concept`. BELUM ada plan/prompt — konsep dulu.
- Multi-household / sharing — **shared ledger + audit trail** (suami-istri: shared + private ledger). Konsep di `docs/konsep-keuangan.md` §7. Butuh geser scope `user_id` → `ledger_id`. Tier Family.

---

## Penilaian (per 2026-07-22)

### Yang berjalan baik

- **Arsitektur solid**: Server Actions → TanStack Query → page pattern konsisten di semua fitur yang sudah jadi. Mudah direplikasi ke fitur baru.
- **Data integrity solid**: balance mutations atomic via Postgres RPC (`apply_transaction_balances`). Zod validation di semua Server Actions. Soft delete. User-id filter manual di setiap query. RLS ON penuh sebagai defense-in-depth.
- **UI kit terpusat**: MultiSelect dengan portal dropdown, `direction` prop, searchable, group support — sudah cukup untuk semua form fitur berikutnya.
- **Pace cepat**: 10+ issue closed — core loop end-to-end + P1 security/integrity bugs semua clear. Siap lanjut fitur Phase 4 (budgets).

### Yang perlu diperhatikan

- ✅ **Zod validation** — semua Server Actions pakai `safeParse` + `issues[0].message`. Schemas di `src/lib/schemas/`. Issue bf-zrl closed.
- **RHF: keputusan tidak dipakai** — form manual (`useState`) cukup untuk semua form yang direncanakan (max 5 field). Adopt hanya jika ada form >8 field atau wizard multi-step.
- 🔄 **Tests**: Vitest unit ada (calcUpdateDeltas, bf-13q ✅). Playwright E2E belum — tambah setelah Phase 4 fitur stabil.
- ✅ **Balance atomic** — semua mutations via Postgres RPC `apply_transaction_balances`. Issue bf-uk7 closed.
- ✅ **Auth callback** — `src/app/auth/callback/route.ts` done. bf-2v2 closed.
- ✅ **Server-side validation** — zod schemas + guards (amount, self-transfer, note) di semua actions. bf-ydb + bf-zrl closed.
