# Prompt: cursor-pointer di semua elemen clickable (bf-lp4)

Kerjakan bf-lp4. Plan lengkap: `docs/plans/2026-07-23-bf-lp4-cursor-pointer-clickable.md` — BACA DULU.

## Tujuan
Semua elemen bisa di-klik menampilkan `cursor: pointer` saat hover (UX polish). Tailwind v4.

## Langkah

### 1. Base Button (WAJIB dulu — fix terbesar)
`src/components/ui/Button.tsx`: tambah `cursor-pointer` + `disabled:cursor-not-allowed` ke class base di dalam `cn(...)`. Cek styling disabled existing dulu, jangan duplikat. Setelah ini SEMUA `<Button>` auto benar — jangan tempel cursor-pointer manual lagi di elemen yang sudah pakai `<Button>`.

### 2. Raw `<button onClick>` (bukan via <Button>)
Tambah `cursor-pointer` ke `className` tiap raw `<button>`. Daftar file di plan Task 2 (17 file, ~28 elemen). Termasuk `src/components/ui/MultiSelect.tsx` (3 button: trigger, option, clear — WAJIB, sering diklik).

### 3. `<div onClick>` — JUDGMENT (jangan pukul rata)
- Backdrop overlay full-screen (`onClick={onClose}`, bg-black/40) → JANGAN kasih cursor-pointer.
- Card/row clickable (buka detail) → kasih cursor-pointer.

### JANGAN
- Jangan over-refactor raw `<button>` jadi `<Button>` kecuali sepele — cukup tempel `cursor-pointer`.
- Jangan sentuh elemen yang SUDAH punya `cursor-pointer` (Fab, TransactionCard, BudgetGroup, ConfirmDialog, sebagian page).
- Jangan ubah logic/handler apa pun — HANYA tambah class.

## Verifikasi
1. `pnpm tsc --noEmit` → 0 error.
2. Hover manual: button/X-close/tab/dropdown → cursor tangan. Disabled → not-allowed. Backdrop → default.

## Scope
HANYA className. Tidak ada perubahan behavior. Commit terpisah dari bf-4ln.
