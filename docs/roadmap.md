# Roadmap: Better Finance v2

> **File ini = peta arah produk.** Sumber tunggal visi + status fitur + next up.
> Diperbarui: 2026-07-22 · Fase: **Phase 4 hampir selesai** — core loop (dashboard → accounts → transactions → balancing) done end-to-end; lanjut fitur sekunder.

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
| Transactions — transfer | ✅ | `/transactions` | From/to account, balance delta pada kedua akun |
| UI kit — minimal | ✅ | `src/components/ui/` | Button, Input, Select, MultiSelect (portal, searchable, groups) + SingleSelect (dari MultiSelect.tsx). Issue bf-bq8 |
| UI kit — lengkap | ⏳ | `src/components/ui/` | Checkbox, Modal reusable, Toast/Sonner, DatePicker, Badge, Skeleton, Textarea, Switch. Issue **bf-qxb** (P3, open) |
| Budgets | ⏳ | `/budgets` | Monthly + weekly pool, progress bar |
| Goals | ⏳ | `/goals` | Progress, grouped by type, CRUD |
| Assets | ⏳ | `/assets` | Net worth toggle, non-liquid accounts |
| Wallet denominations | ⏳ | `/accounts/[id]` | Rincian pecahan uang fisik utk akun wallet (`is_wallet`). Table `wallet_denominations` sudah ada di schema. Ada di v1 |
| Wishlist | ⏳ | `/wishlist` | Affordability check |
| Settings | ⏳ | `/settings` | Profil, theme, privacy |
| PWA | 🔄 | — | Manifest + globals ada; service worker & install UI belum |
| Tests | ⏳ | — | Vitest unit + Playwright E2E belum ada |

> **Schema sudah siap, fitur belum:** semua tabel sudah ada di `src/db/schema.ts` (11 tabel) — `budgets`, `savings_goals`, `wishlists`, `wallet_denominations`, `account_balance_snapshots`, `ai_insights`. Bangun fitur = tinggal query + UI, tidak perlu migrasi schema baru.

---

## Fase yang Sudah Selesai

### ✅ Phase 1 — Database
- [x] Jalankan SQL schema ke Supabase (11 tabel + triggers + views) — SQL dari `prj-better-finance/plan.md`
- [x] Verifikasi trigger: signup → auto-seed `account_types` + `categories`
- [x] Verifikasi free-tier: insert akun ke-6 gagal (`check_account_limit`)
- [x] `drizzle-kit introspect` sync — `src/db/schema.ts` cocok DB

### Phase 2 — Auth & shell
- [x] Signin/signup via Server Actions + `useActionState`
- [x] Proxy proteksi route `(app)` — redirect ke `/signin` kalau belum auth
- [ ] ⚠️ Auth callback route (`/auth/callback`) — **BELUM ADA** (klaim lama salah). `signUp` redirect `emailRedirectTo: .../auth/callback` → 404 saat verify email. Bikin `src/app/auth/callback/route.ts` yang `exchangeCodeForSession`. Issue **bf-2v2**

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
- [ ] Wallet denominations — rincian pecahan fisik untuk akun wallet (`is_wallet`). Table `wallet_denominations` sudah di schema. Ada di v1 route `/accounts/[id]`
- [ ] Budgets — monthly + weekly pool distribution
- [ ] Goals — progress, grouped by type, CRUD
- [ ] Assets — net worth toggle, filter non-liquid accounts
- [ ] Wishlist — affordability check
- [ ] Settings — profil user + privacy preference persistence

**Urutan next:** Budgets (paling sering dibuka di v1, depends transactions ✅) → Goals → Assets → Wallet denominations → Wishlist → Settings

### Phase 5 — Polish + PWA + Tests

- `next-pwa` + service worker + install prompt
- Vitest: helper finansial (formatCurrency, budget color, week calc)
- Playwright: E2E signin → tambah transaksi → cek dashboard update
- UI kit lengkap (**bf-qxb**, P3 open) — sudah dipindah ke tabel Status Fitur di atas; kerjakan on-demand saat fitur baru butuh komponen (mis. DatePicker utk budgets)

### Phase 6 — Migrasi data v1 → v2 (opsional, belum dikerjakan)

> Beda dari schema migration (Drizzle, `drizzle/*.sql` — sudah ada) & seed dummy (`docs/seed/dummy-accounts.sql` — sudah ada). Ini migrasi **data asli** dari Sheets. `scripts/` belum dibuat.

- Skrip `scripts/migrate.ts` — transform dari Google Sheets export
- Dedup via hash
- Verifikasi total saldo & jumlah transaksi cocok v1

---

## Ditunda

- AI insights (`ai_insights`) + integrasi model
- Subscription enforcement penuh + Stripe
- Realtime subscriptions
- Multi-household / sharing

---

## Penilaian (per 2026-07-22)

### Yang berjalan baik

- **Arsitektur solid**: Server Actions → TanStack Query → page pattern konsisten di semua fitur yang sudah jadi. Mudah direplikasi ke fitur baru.
- **Data integrity (per-query)**: `adjustAccountBalance` pakai SQL delta atomik (no race per-update). Soft delete. User-id filter manual di **setiap** query (verified). RLS ON penuh (11 tabel, 21 policy) sebagai defense-in-depth walau Drizzle bypass via connection string. Catatan: atomik per-update ≠ atomik per-transfer (lihat bawah).
- **UI kit terpusat**: MultiSelect dengan portal dropdown, `direction` prop, searchable, group support — sudah cukup untuk semua form fitur berikutnya.
- **Pace cepat**: 5 issue closed dalam satu sprint (dashboard, accounts, transactions, balancing, UI kit). Core finance loop sudah jalan end-to-end.

### Yang perlu diperhatikan

- **🔴 Zod tidak dipakai sama sekali** (padahal keputusan planning: RHF + zod). Server Actions terima `input: CreateTransactionInput` — TS type = **0 validasi runtime**. Client bisa kirim `amount` negatif/NaN, `transaction_type` arbitrer, `transaction_date` sampah → saldo korup. `requireUser` + account-ownership check sudah ada, tapi **field-level validation di trust boundary belum**. Ini bukan lazy-skip. Fix: 1 zod schema per action input di `lib/schemas/`, `.parse()` di awal action. Issue **bf-zrl**.
- **RHF belum kepakai**: form CRUD masih manual (bottom sheet + useState), bukan react-hook-form. Bukan bug, tapi menyimpang dari stack yang disepakati. Adopsi saat form makin kompleks (budget/goal), atau biarkan kalau manual sudah cukup — putuskan sadar, jangan drift.
- **Tidak ada tests**: zero coverage saat ini. Bug di balance calculation atau filter logic tidak akan ketahuan sampai user report. Minimal tambah Vitest untuk `formatCurrency` + `adjustAccountBalance` logic sebelum launch.
- **Transfer tidak atomic**: pgBouncer transaction mode (port 6543) blokir `BEGIN`/`SAVEPOINT`. Kalau debit sukses tapi credit gagal, balance inkonsisten. Fix: switch ke session mode (port 5432) atau pakai Supabase Edge Function dengan `pg_transaction`. Prioritaskan sebelum banyak user.
- **Auth belum diuji E2E**: signin/signup ada tapi belum ada test atau verifikasi end-to-end dengan real user flow.
- **`note` wajib di transactions**: keputusan UX yang bagus untuk searchability, tapi perlu konsisten di validasi server-side juga (saat ini hanya enforced di form).
