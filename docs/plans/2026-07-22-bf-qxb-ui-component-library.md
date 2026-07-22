# Plan: Comprehensive UI Component Library (bf-qxb)

**Date:** 2026-07-22
**Issue:** bf-qxb · P3 Feature
**Depends on:** bf-bq8 (closed, UI kit minimal sudah ada)
**Files baru:** `src/components/ui/` — multiple components

## Context

UI kit minimal sudah ada: Button, Input, Select, MultiSelect (SingleSelect diekspor dari MultiSelect.tsx). Perlu tambah:
- Checkbox
- Modal/BottomSheet reusable
- Toast (Sonner)
- DatePicker
- Badge
- Skeleton
- Textarea
- Switch/Toggle

Referensi: `docs/reference-projects.md` → PMS src/components/ui/ (Tailwind v3→v4 port) + better-planner.

**Prioritas implementasi (berdasarkan kebutuhan fitur berikutnya — budgets, goals):**
1. Skeleton (dibutuhkan semua loading state)
2. Badge (label status budget/goal)
3. Textarea (description field di goals)
4. Switch (toggle aktif/nonaktif)
5. Toast/Sonner (feedback actions)
6. DatePicker (budget period, goal deadline)
7. Checkbox (filter multi-select alternatif)
8. Modal/BottomSheet reusable (refactor bottom sheets yang ada)

## Task 1 — Skeleton (`src/components/ui/Skeleton.tsx`)

```tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded-md", className)} />
  );
}
```

## Task 2 — Badge (`src/components/ui/Badge.tsx`)

```tsx
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
```

## Task 3 — Textarea (`src/components/ui/Textarea.tsx`)

```tsx
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        className={cn(
          "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          error && "border-red-400 focus:ring-red-500",
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
```

## Task 4 — Switch (`src/components/ui/Switch.tsx`)

```tsx
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          checked ? "bg-blue-500" : "bg-gray-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
```

## Task 5 — Toast/Sonner

Install sonner jika belum ada:
```bash
pnpm add sonner
```

Buat `src/components/ui/Toaster.tsx`:
```tsx
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        className: "text-sm",
      }}
    />
  );
}
```

Export `toast` dari sonner langsung di consumer — tidak perlu wrapper.

Tambah `<Toaster />` di `src/app/(app)/layout.tsx`:
```tsx
import { Toaster } from "@/components/ui/Toaster";
// di return:
<Toaster />
```

## Task 6 — Update exports / dokumentasi

Cek apakah ada `src/components/ui/index.ts` — kalau ada, tambah export baru. Kalau tidak ada, biarkan (import per-file).

Update AGENTS.md table UI Components dengan component baru.

## Tidak dikerjakan di issue ini (YAGNI)
- DatePicker — tunggu sampai budgets/goals aktif butuh
- Checkbox — MultiSelect sudah handle use case ini
- Modal/BottomSheet reusable — refactor bottom sheets yang ada = scope besar, issue terpisah

## CLAUDE.md Check
- [ ] Component baru: update tabel UI Components di AGENTS.md setelah implementasi
