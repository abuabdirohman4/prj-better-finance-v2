<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Architecture Patterns

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

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
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

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
