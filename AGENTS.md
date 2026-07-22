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
| `Input` | Text/date/email input dengan label + error state |
| `Select` | Single dropdown — form field atau `variant="filter"` untuk filter inline |
| `MultiSelect` | Multi-select dengan searchable + checkbox. Pakai `iconPrefix` emoji untuk filter v1-style |

**Reference Projects:** Lihat `docs/reference-projects.md` sebelum explore projek acuan (prj-better-finance v1, portfolio-management-service, prj-better-planner, school-management) — hemat token.

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
