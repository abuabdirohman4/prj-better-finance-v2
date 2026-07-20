# Type Hierarchy

Pola: Base → Extended → Full. Import HANYA dari file kanonik di folder ini, jangan define ulang tipe yang sudah ada.

## Hierarki

```
AccountBase          → Account (+ balances)       → AccountWithType (+ joins)
TransactionBase      → Transaction (+ relations)  → TransactionWithDetails (+ full joins)
CategoryBase         → Category                   → (tidak ada full — flat)
BudgetBase           → Budget                     → BudgetWithSpending (+ computed)
SavingsGoalBase      → SavingsGoal                → GoalWithProgress (+ computed %)
WishlistBase         → WishlistItem               → (+ linked goal)
```

## Aturan

- Jangan buat tipe duplikat di `_components/types.ts` kalau sudah ada di sini
- `*Base` = kolom DB minimal. Gunakan ini sebagai type form input (sebelum save)
- `*WithDetails` / `*WithProgress` = joined + computed — hanya dari Server Action/query
- Zod schema untuk form di `lib/schemas/` — `z.infer<typeof schema>` bukan define ulang
- Kolom UUID selalu `string` di TS (bukan `number`)
