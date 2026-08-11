# bf-uaw — Sort Order Akun: Drag-and-Drop Reorder

**Date:** 2026-08-11  
**Issue:** bf-uaw  
**Status:** Plan  
**Migration:** ❌ None (kolom `sort_order` sudah ada)

---

## Context

Akun di `/accounts` (liquid) belum urut sesuai keinginan user. Kolom `sort_order` sudah ada di DB (`accounts.sort_order`, default 0) tapi AR/AP + akun baru dari import belum ter-set. Butuh: (1) UI reorder, (2) AR/AP sort ke akhir (atau tidak muncul — sudah dihandle bf-3e0 `is_liability` filter).

**Existing:**
- `getAccountsWithType` sudah `.orderBy(accounts.sort_order)`
- `updateAccount` sudah bisa set `sort_order`

**Keputusan implementasi:** drag-and-drop mobile-friendly butuh lib (dnd-kit). Cek `package.json` dulu — kalau belum ada, **pakai pendekatan lebih simple dulu**: tombol up/down per akun (move up / move down). Drag-drop bisa iterate nanti (bf-uaw v2). Alasan: mobile drag-drop finicky + nambah dependency. Up/down button cukup untuk MVP reorder.

> ⚡ Ponytail: mulai dari up/down buttons (no dep). Drag-drop hanya kalau user minta.

---

## Design

Mode "reorder" di `/accounts`:
- Tombol "Reorder" di header → masuk mode reorder
- Tiap AccountCard dapat ▲▼ buttons
- Klik ▲ → swap sort_order dengan akun di atasnya; ▼ → swap dengan bawahnya
- "Done" → keluar mode reorder
- Persist tiap swap langsung (optimistic update + server action)

---

## Tasks

### Task 1 — Action: reorder (swap sort_order 2 akun)

**File:** `src/app/(app)/accounts/actions.ts`

```ts
import { reorderAccounts } from "@/db/queries/accounts";

export async function reorderAccountsAction(
  updates: { id: string; sort_order: number }[]
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    if (updates.length === 0) return { success: true };
    // validate all uuid
    for (const u of updates) {
      if (!z.string().uuid().safeParse(u.id).success) {
        return { success: false, message: "ID akun tidak valid." };
      }
    }
    await reorderAccounts(user.id, updates);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "mengurutkan akun").message };
  }
}
```
> Import `z` kalau belum ada di file.

### Task 2 — Query: bulk update sort_order

**File:** `src/db/queries/accounts.ts`

```ts
export async function reorderAccounts(
  userId: string,
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  // Satu update per akun; kecil (<50 akun) jadi loop OK.
  // ponytail: loop update, batch CASE-WHEN kalau jumlah akun besar
  for (const u of updates) {
    await db
      .update(accounts)
      .set({ sort_order: u.sort_order, updated_at: new Date() })
      .where(and(eq(accounts.id, u.id), eq(accounts.user_id, userId)));
  }
}
```

### Task 3 — UI reorder mode di /accounts

**File:** `src/app/(app)/accounts/page.tsx`

Tambah state `reorderMode: boolean`. Header dapat tombol toggle "Reorder"/"Done".

Saat reorderMode aktif, render list akun dengan ▲▼ buttons (bukan grid link biasa). Handler:
```tsx
const [reorderMode, setReorderMode] = useState(false);

function move(index: number, dir: -1 | 1) {
  const arr = [...liquidAccounts];
  const target = index + dir;
  if (target < 0 || target >= arr.length) return;
  [arr[index], arr[target]] = [arr[target], arr[index]];
  // reassign sort_order sequential
  const updates = arr.map((a, i) => ({ id: a.id, sort_order: i }));
  // optimistic: update cache
  queryClient.setQueryData(accountKeys.list(), (old: AccountRow[] = []) => {
    const map = new Map(updates.map(u => [u.id, u.sort_order]));
    return [...old].map(a => map.has(a.id) ? { ...a, sort_order: map.get(a.id)! } : a)
      .sort((x, y) => x.sort_order - y.sort_order);
  });
  reorderAccountsAction(updates).then(() => {
    queryClient.invalidateQueries({ queryKey: accountKeys.list() });
  });
}
```

Reorder list JSX (saat reorderMode):
```tsx
{reorderMode ? (
  <div className="space-y-2">
    {liquidAccounts.map((a, i) => (
      <div key={a.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
        <span className="flex-1 font-medium text-gray-800">{a.name}</span>
        <button onClick={() => move(i, -1)} disabled={i === 0}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-30">▲</button>
        <button onClick={() => move(i, 1)} disabled={i === liquidAccounts.length - 1}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-30">▼</button>
      </div>
    ))}
  </div>
) : (
  /* existing grid */
)}
```

Header toggle:
```tsx
<button onClick={() => setReorderMode(!reorderMode)} className="text-sm font-medium text-white/90">
  {reorderMode ? "Done" : "Reorder"}
</button>
```

### Task 4 — (Optional) SQL fix AR/AP + import akun sort_order

Kalau user mau AR/AP di akhir sekarang juga (sebelum UI dipakai), Claude bisa jalankan via MCP:
```sql
-- set AR/AP dan akun tanpa sort ke akhir
UPDATE accounts SET sort_order = 999 WHERE user_id = '<user_id>' AND sort_order = 0;
```
> Opsional, tanya user dulu. Bukan blocker.

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/app/(app)/accounts/actions.ts` | `reorderAccountsAction` |
| `src/db/queries/accounts.ts` | `reorderAccounts` |
| `src/app/(app)/accounts/page.tsx` | Reorder mode UI |

Threshold: 3 files → **Mode A (Antigravity)**

---

## Skipped / Ceiling
- **Drag-and-drop**: skipped, pakai ▲▼ buttons. Add dnd-kit only kalau user minta drag UX. `ponytail: up/down swap, dnd-kit if drag UX requested`
- `/assets` reorder: non-liquid akun reorder bisa follow same pattern nanti — scope awal `/accounts` saja.

---

## CLAUDE.md Check
- [ ] Pattern baru: reorder via ▲▼ swap + bulk sort_order update
- [ ] Tidak ada schema baru
- [ ] Tidak ada route baru
- [ ] Update AGENTS.md kalau perlu
