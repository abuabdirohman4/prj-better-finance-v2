# Roadmap: Better Finance v2

> **File ini = peta arah produk.** Sumber tunggal visi + status fitur + next up.
> Diperbarui: 2026-07-22 · Fase: **Phase 4 aktif** — Budgets (monthly + weekly) ✅; lanjut Goals, Assets, Wishlist, Settings.

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
| Budgets | ✅ | `/budgets`, `/budgets/weekly` | Monthly CRUD + progress bar (bf-n43 ✅); weekly cascade algorithm (bf-9qc ✅) |
| Goals | ⏳ | `/goals` | Progress, grouped by type, CRUD |
| Assets | ⏳ | `/assets` | Net worth toggle, non-liquid accounts |
| Wallet denominations | ✅ | `/accounts/[id]` | Section di halaman balancing, hanya akun `is_wallet`. Grid pecahan + live total + auto-save reality check. Issue bf-p8w |
| Wishlist | ⏳ | `/wishlist` | Affordability check |
| Settings | ⏳ | `/settings` | Profil, theme, privacy |
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
- [ ] Goals — progress, grouped by type, CRUD
- [ ] Assets — net worth toggle, filter non-liquid accounts
- [ ] Wishlist — affordability check
- [ ] Settings — profil user + privacy preference persistence

✅ **Semua P1 bugs closed:**
1. ✅ **bf-2v2** — auth callback `/auth/callback`
2. ✅ **bf-ydb** — server-side validation (covered by bf-zrl)
3. ✅ **bf-zrl** — zod schemas + safeParse semua Server Actions
4. ✅ **bf-uk7** — balance atomic via Postgres RPC `apply_transaction_balances`
5. ✅ **bf-13q** — `calcUpdateDeltas` pure function + 5 Vitest cases

**Lanjut fitur Phase 4:**
1. ✅ **Budgets** — monthly CRUD (bf-n43) + weekly cascade (bf-9qc)
2. **Goals** — progress, grouped by type, CRUD (bf-73n)
3. **Assets** — net worth toggle, non-liquid accounts (bf-9v5)
4. **Wishlist** (bf-ez2) → **Settings** (bf-9vf)

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
