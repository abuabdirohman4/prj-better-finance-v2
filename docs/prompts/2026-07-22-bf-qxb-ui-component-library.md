# Prompt: Comprehensive UI Component Library (bf-qxb)

CONTEXT:
Better Finance v2 — Next.js 16, Tailwind v4, React 19.
UI kit minimal sudah ada di src/components/ui/ (Button, Input, Select, MultiSelect).

CRITICAL: Baca @AGENTS.md untuk semua rules. Tailwind v4 — pakai bg-linear-to-{dir}, bukan bg-gradient-to-{dir}.

TASK:
Eksekusi plan di @docs/plans/2026-07-22-bf-qxb-ui-component-library.md

ISSUE: bf-qxb

REQUIREMENTS:
1. Buat: Skeleton, Badge, Textarea, Switch (Task 1-4) — tidak butuh install apapun
2. Sonner (Task 5): cek dulu apakah sudah terpasang (grep package.json) sebelum pnpm add
3. Update AGENTS.md table setelah semua component jadi
4. DatePicker, Checkbox, Modal — SKIP (YAGNI, lihat plan)
5. Jangan commit — user yang commit setelah review

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-qxb-ui-component-library.md
- Existing UI kit: @src/components/ui/Button.tsx (pattern reference)
- utils cn: @src/lib/utils.ts
- Layout (untuk Toaster): @src/app/(app)/layout.tsx
- AGENTS.md: @AGENTS.md (untuk update tabel)
