<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Architecture Patterns

## Language: English-first (UI wording)

**Semua wording di UI aplikasi WAJIB English** — label, button, placeholder, empty state, error message yang tampil ke user, tooltip. Multi-bahasa (termasuk Indonesian) menyusul lewat i18n; sampai itu ada, default English.

- Berlaku: teks JSX, zod schema messages, thrown Error messages yang di-surface ke UI.
- TIDAK berlaku: komentar kode, nama variabel (boleh apa adanya), doc internal (plan/prompt boleh Indonesian).
- **Debt:** `ErrorContext` union di `src/lib/errorUtils.ts` + fallback `getErrorMessage` masih Indonesian (shared semua fitur). Translate saat i18n pass global, bukan per-fitur.


> **Integrasi fitur (Goals/Assets/Transactions/Budgets):** READ `docs/architecture-integration.md` sebelum kerja di goals/assets/budget derivation — jelaskan model 1-source-of-truth (transaksi → semua view derived) + keputusan `goal_id` eksplisit.

### Data Layer (`src/db/queries/`)
Drizzle query functions — WAJIB filter `where(eq(table.user_id, userId))` di setiap query.
DB tidak RLS-aware (pakai admin credentials) — filter manual wajib, jangan rely on Supabase RLS.

### Server Actions (`src/app/(app)/**/actions.ts`)
Semua Server Actions return `ServerActionResult<T>` dari `lib/errorUtils`:
- `requireUser()` → throws jika tidak auth
- Return `{ success: true, data }` atau `{ success: false, message }`
- Wrap dengan `handleApiError(error, "context")` di catch
- **Validasi WAJIB di server, bukan hanya form.** Form bisa di-bypass (direct action call). Guard di trust boundary: amount > 0, ownership akun (`getAccountById` sebelum mutate), reject self-transfer (`account_id !== to_account_id`), field required.

### Balance Mutation
**Semua balance mutations WAJIB pakai `applyTransactionBalancesRpc`** — atomic via Postgres RPC `apply_transaction_balances`.

```ts
// Pattern wajib di semua actions yang mutate balance:
const adjustments: { account_id: string; delta: number }[] = [
  { account_id: sourceId, delta: -amount },
  { account_id: destId,   delta: +amount },  // transfer only
];
await applyTransactionBalancesRpc(user.id, adjustments);  // src/db/queries/accounts.ts
```

**WAJIB verifikasi ownership akun SEBELUM mutate** — `getAccountById(user.id, accountId)` untuk SETIAP akun yang disentuh (source + dest), termasuk saat edit ganti akun. RPC `apply_transaction_balances` juga self-guard (`WHERE user_id = p_user_id`, raise exception kalau 0 rows) sebagai lapis kedua — tapi jangan andalkan itu saja, guard di action tetap wajib.

- **Create**: earning → `+amount`, spending/transfer → `-amount`. Transfer juga `+amount` ke `to_account_id`.
- **Edit/Delete**: kumpulkan reverse lama + apply baru dalam 1 array → 1 RPC call. Lihat `transactions/actions.ts` sebagai referensi.
- `adjustAccountBalance` masih ada di query layer untuk non-transaction mutations (e.g. walletDenominations reality check) — jangan dipakai untuk transaction create/edit/delete.

### TanStack Query Hooks (`src/app/(app)/**/_hooks/`)
Hook per feature, co-located di folder feature. Query key generators di `src/lib/query.ts`.
Pattern: queryFn memanggil Server Action → throw jika `!res.success`.

### Account Visuals (`src/lib/accountVisuals.ts`)
Key = nama akun exact, case-sensitive (match `accounts.name` di DB).
`getAccountVisual(name)` → `{ initials, isWalletIcon, iconColor, iconBg, accent, text }`.
Tambah entry di `LOGOS` + `COLOR_SCHEMES` saat ada akun baru.

### Page Pattern
Semua halaman fitur: `"use client"` + TanStack Query hook. Server Actions dipanggil dari hook.
Header gradient + wave SVG: copy dari `src/app/(app)/page.tsx`.

**Tailwind v4:** Pakai `bg-linear-to-{dir}` bukan `bg-gradient-to-{dir}` (breaking change dari v3).
Pakai `shrink-0` bukan `flex-shrink-0` (v4 shorthand).
Contoh: `bg-linear-to-r from-blue-600 to-indigo-800`, `bg-linear-to-br from-gray-50 to-indigo-50`.

**Header accounts page:** back button (`ChevronLeft w-7 h-7`) + judul sejajar horizontal, bukan stacked.
Body dimulai dengan `mt-6` (bukan `pt-2`) untuk spacing wave → content.

### Currency Formatting (`src/lib/helper.ts`)
- `formatCurrency(amount)` → `Rp 1.000.000`
- `formatCurrency(amount, "signs")` → `+Rp 1.000` / `-Rp 1.000`
- `formatCurrency(amount, "superscript")` → HTML string dengan `<sup>` → pakai `dangerouslySetInnerHTML` (ATM accounts saja)
- `formatCurrency(amount, "short")` → `1,5 jt`

### Privacy Mask
`usePrivacyStore` (Zustand) di `src/stores/privacyStore.ts` — `hideBalances: boolean`, `toggleHideBalances()`.
Semua komponen yang tampilkan saldo WAJIB cek `hideBalances`.

### UI Components (`src/components/ui/`)
Reusable primitives — pakai untuk semua form, filter, button di seluruh v2.

| Component | Kapan pakai |
|---|---|
| `Button` | Semua tombol aksi. `variant="outline"` untuk secondary, `variant="ghost"` untuk subtle |
| `Input` | Text/date/email/number input dengan label + error state. Pakai ini juga untuk field custom (mis. Jumlah dual-state) biar tinggi konsisten |
| `Select` | Native dropdown — **hindari untuk form** (dropdown OS jelek, no search). Pakai `SingleSelect` |
| `SingleSelect` | Single-pick di form. Diekspor dari `MultiSelect.tsx` (wrapper tipis). Portal dropdown, searchable, optgroup |
| `MultiSelect` | Multi-select dengan searchable + checkbox. Pakai `iconPrefix` emoji untuk filter v1-style |

`MultiSelect`/`SingleSelect` prop `direction`: `"down" | "up" | "auto"` (default `"auto"` — flip otomatis kalau ruang bawah sempit). Pakai `"up"` untuk field di bagian bawah bottom sheet.

**Reference Projects:** Lihat `docs/reference-projects.md` sebelum explore projek acuan (prj-better-finance v1, portfolio-management-service, prj-better-planner, school-management) — hemat token.


## Implementation Workflow

**WAJIB jalankan `/new-feature-workflow` sebelum implementasi apapun** — fitur baru, bug fix, refactor, semua.

Workflow ini (diadaptasi untuk project ini, no GitHub remote):

1. **Explore** — baca file relevan, pahami context
2. **Plan file** — simpan ke `docs/plans/YYYY-MM-DD-<bf-id>-<feature>.md` (ultra-detail: path, code snippet, command exact)
3. **Beads issue** — `bd create` (kalau belum ada), lalu `/rename bf-xxx <slug>` di sesi chat
4. ~~GitHub Issue~~ — **skip** (no git remote di project ini)
5. **Prompt file** — simpan ke `docs/prompts/YYYY-MM-DD-<bf-id>-<feature>.md` (siap paste ke Antigravity)
6. **Pilih mode A (Antigravity) atau B (direct)** — threshold: >=3 files ATAU >=100 lines -> A

### Model per phase

| Phase | Model |
|---|---|
| Explore + plan (judgment, arsitektur) | **Opus** |
| Eksekusi dari plan (kode dari spec jelas) | **Sonnet** |

## Build / Test / Lint

```bash
npm run dev        # dev server (next dev)
npm run build      # production build — WAJIB lolos sebelum close issue (satu-satunya cara catch typo query/import)
npm run test:run   # vitest sekali jalan (balance math unit tests)
npm run test:e2e   # playwright
npm run format     # prettier --write
```
> Claude: JANGAN jalankan `build`/`test` sendiri (boros token) — minta user, analisa hasilnya saja.

## Asset Category (`accounts.asset_category`)

Enum: `"liquid" | "investment" | "property" | "other"` (lihat `src/lib/constants.ts`).
- **liquid** = uang siap pakai (Wallet, Bank, e-wallet) → dasar "uang bebas" di wishlist affordability + agregat kartu Accounts di Net Worth.
- **investment/property/other** = non-liquid → kartu per-akun di Net Worth.
`getAccountsWithType(userId)` return `asset_category` per akun. Filter `=== "liquid"` untuk liquid balance.

## Goals: `collected_amount` derived (bf-4ln)

`getGoals` (`src/db/queries/goals.ts`) hitung `collected_amount` = base kolom + Σ `transactions` bertipe `transfer` dengan `goal_id` match (deleted_at NULL). **Derived, bukan kolom mentah** — jangan baca `savings_goals.collected_amount` langsung untuk progress. `percent = collected/target*100`.

## Wishlist Affordability (bf-ez2)

"Bisa beli" ≠ punya uang. Patokan = **uang bebas** = liquid − Σ sisa target goal aktif (dana darurat = `goal_type "emergency"`, jadi ikut terhitung). 3 tingkat: 🟢 freeCash≥harga · ⚠️ liquid cukup tapi kuras alokasi · 🔴 liquid kurang. Lihat `getAffordabilityAction` di `wishlist/actions.ts`.

## Feature Pages (`src/app/(app)/`)

`accounts` · `assets` (Net Worth) · `budgets` · `goals` · `settings` · `transactions` · `wishlist`. Semua ikut Page Pattern di atas.
