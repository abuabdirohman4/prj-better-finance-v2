# Reference Projects

Baca file ini sebelum explore ulang projek referensi — hemat token.

---

## prj-better-finance (v1) — UI/flow reference

**Path:** `/Users/abuabdirohman/Documents/Programs/Project/prj-better-finance`
**Stack:** Next.js 13 (JS), Google Sheets backend, Tailwind v3, SWR
**Pakai untuk:** Replika UI + flow 1:1. Setiap fitur baru di v2 → baca v1 dulu.

| Area | File v1 |
|---|---|
| Transactions list + filter | `app/transactions/page.js` |
| Filter dropdown (multi-select custom) | `components/TransactionFilter/index.js`, `components/FilterDropdown/index.js` |
| Transaction card | `components/Card/Transaction.js` |
| Accounts list | `app/accounts/page.js` |
| Budgets | `app/budget/page.js` |
| Goals | `app/goal/page.js` |
| Wallet denominations | `app/denominations/page.js` |
| API routes (Sheets) | `app/api/*/route.js` |
| Hooks (SWR) | `utils/hooks.js` |
| Constants (categories, accounts) | `utils/constants.js` |

---

## portfolio-management-service — BEST components

**Path:** `/Applications/XAMPP/xamppfiles/htdocs/aw-miscroservices/portfolio-management-service/apps/frontend`
**Stack:** Next.js 16, React 19, **Tailwind v3**, CVA, react-hook-form+zod, lucide-react, sonner
**Components:** `src/components/ui/`

| Component | File | Fitur |
|---|---|---|
| Button | `button.tsx` | CVA variants: primary/green/red/dark/outline* |
| Input | `input-group/index.tsx` | Label, error (RHF), icon left/right |
| Textarea | `input-group/text-area.tsx` | Label, error, resize |
| Select (single, native) | `select.tsx` | Variant form/filter, optgroup, chevron |
| **ComboSelect** | `combo-select.tsx` | **Searchable, multi/single, portal dropdown, checkbox, select-all, groups** |
| Checkbox | `checkbox.tsx` | Indeterminate state |
| Modal | `modal/modal.tsx` | Portal, size sm/md/lg/xl |
| ConfirmModal | `modal/confirm-modal.tsx` | Confirm dialog |
| Dropdown menu | `dropdown.tsx` | Context-based menu, portal |
| Switch | `switch.tsx` | Toggle |
| Tooltip | `tooltip.tsx` | |
| Tabs | `tabs.tsx` | |
| Skeleton | `skeleton.tsx` | |

**⚠️ Tailwind v3 — perlu port ke v4 saat copy:**
- CVA → ganti variant maps + `cn()` (no CVA)
- Hapus semua `dark:*` classes (v2 belum pakai dark mode)
- Design token custom → lihat mapping di bawah
- `bg-gradient-to-*` → `bg-linear-to-*` (breaking change v4)
- Spacing `4.5`/`5.5`/`12.5` → round ke Tailwind standard (`px-4`, `py-3`, `pl-11`)

---

## prj-better-planner — Tailwind v4, cn(), manual variants

**Path:** `/Users/abuabdirohman/Documents/Programs/Project/prj-better-planner`
**Stack:** **Tailwind v4**, cn(), lucide-react, flatpickr, tiptap, sonner
**Components:** `src/components/ui/`

Primitives: Button, Input, Dropdown, DropdownItem, Modal, ConfirmModal, Spinner, Skeleton, Tooltip, Slider, RichTextEditor

**Cocok untuk:** Drop-in ke v2 tanpa translate (sudah v4). Tak ada searchable multi-select.

---

## school-management — Tailwind v4 + Ant Design

**Path:** `/Users/abuabdirohman/Documents/OpenSource/school-management`
**Stack:** **Tailwind v4**, cn(), Ant Design 5.27, recharts, sonner, SWR
**Components:** `src/components/ui/` + Ant untuk tabel/form kompleks

Primitives: Button (+FAB), Input, Dropdown, Modal, ConfirmModal, Spinner, Skeleton, Tooltip, Pagination, RichTextEditor, LanguageToggle

**Cocok untuk:** FloatingActionButton pattern, pagination, pola v4.

---

## Design Token Mapping: PMS (v3) → v2 (Tailwind v4)

| PMS token | v2 Tailwind v4 standar |
|---|---|
| `text-primary` / `bg-primary` / `border-primary` | `text-blue-600` / `bg-blue-600` / `border-blue-600` |
| `border-stroke` | `border-gray-300` |
| `text-dark` | `text-gray-900` |
| `text-dark-5` | `text-gray-400` |
| `text-dark-6` | `text-gray-500` |
| `bg-gray-2` | `bg-gray-100` |
| `bg-gray-3` | `bg-gray-50` |
| `text-red` / `bg-red` / `border-red` | `text-red-500` / `bg-red-500` / `border-red-500` |
| `text-green` / `bg-green` | `text-green-600` / `bg-green-600` |
| `bg-gradient-to-*` | `bg-linear-to-*` (**v4 breaking**) |
| `px-4.5` / `py-5.5` | `px-4` / `py-5` (round ke terdekat) |
| semua `dark:*` | **hapus** — v2 belum dark mode |

---

## v2 sendiri — prj-better-finance-v2

**Stack:** Next.js 16, **Tailwind v4**, Drizzle ORM, Supabase, TanStack Query, Zustand, lucide-react
**UI kit:** `src/components/ui/` — dibangun issue bf-bq8

| Component | File | Notes |
|---|---|---|
| Button | `Button.tsx` | variant: primary/outline/ghost/danger; size: sm/md/lg |
| Input | `Input.tsx` | label, error, icon left/right |
| Select | `Select.tsx` | single, native + chevron; variant form/filter; optgroup; iconPrefix emoji |
| MultiSelect | `MultiSelect.tsx` | searchable, portal, checkbox, select-all; iconPrefix emoji; clear button |

**Utilities:** `cn()` di `src/lib/utils.ts`

**Patterns:**
- `variant="filter"` → styling tipis untuk filter panel inline
- `variant="form"` → label + border + error state penuh
- MultiSelect `iconPrefix` → emoji prefix (💰 🏦 📂) untuk filter v1-style
- MultiSelect `searchable` → aktifkan search input di dalam panel
