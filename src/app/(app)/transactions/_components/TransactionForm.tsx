"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/helper";
import { Input } from "@/components/ui/Input";
import { SingleSelect } from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { productLabel } from "@/lib/investment";
import { transactionKeys } from "@/lib/query";
import { getGoalsForTransferAction } from "../actions";
import type { AccountRow, CategoryRow } from "@/db/queries/accounts";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/lib/schemas/transaction";

interface TransactionFormProps {
  accounts: AccountRow[];
  categories: CategoryRow[];
  onSubmit: (input: CreateTransactionInput | UpdateTransactionInput) => void;
  isPending: boolean;
  error?: string | null;
  initialValues?: {
    transaction_type: "spending" | "earning" | "transfer";
    transaction_date: string;
    account_id: string;
    to_account_id?: string | null;
    goal_id?: string | null;
    category_id?: string | null;
    amount: number;
    note?: string | null;
  };
}

type TxType = "spending" | "earning" | "transfer";

const TYPE_LABELS: Record<TxType, string> = {
  spending: "Spending",
  earning: "Earning",
  transfer: "Transfer",
};

const TYPE_ACTIVE: Record<TxType, string> = {
  spending: "bg-red-500 text-white",
  earning: "bg-green-500 text-white",
  transfer: "bg-blue-500 text-white",
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  accounts,
  categories,
  onSubmit,
  isPending,
  error,
  initialValues,
}: TransactionFormProps) {
  const init = initialValues;
  const initAmount = init?.amount ? String(init.amount) : "";

  const [txType, setTxType] = useState<TxType>((init?.transaction_type as TxType) ?? "spending");
  const [date, setDate] = useState(init?.transaction_date ?? todayStr());
  const [accountId, setAccountId] = useState(init?.account_id ?? accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(init?.to_account_id ?? "");
  const [goalId, setGoalId] = useState(init?.goal_id ?? "");
  const [categoryId, setCategoryId] = useState(init?.category_id ?? "");
  const [rawAmount, setRawAmount] = useState(initAmount);
  const [displayAmount, setDisplayAmount] = useState(
    initAmount ? formatCurrency(Number(initAmount)) : ""
  );
  const [note, setNote] = useState(init?.note ?? "");

  const { data: goalsRes } = useQuery({
    queryKey: transactionKeys.goalsForTransfer(),
    queryFn: async () => getGoalsForTransferAction(),
    enabled: txType === "transfer" || txType === "spending",
  });
  const goalsForTransfer = (goalsRes?.success ? goalsRes.data : []) ?? [];

  // Akun investasi dikelompokkan per investment_group (optgroup di SingleSelect);
  // label produk dipendekkan karena nama grup sudah jadi header.
  const toAccountOption = (a: (typeof accounts)[number]) =>
    a.asset_category === "investment"
      ? { value: a.id, label: productLabel(a.name), group: a.investment_group ?? "Investment" }
      : { value: a.id, label: a.name };

  const accountOptions = accounts.map(toAccountOption);

  const toAccountOptions = accounts.filter((a) => a.id !== accountId).map(toAccountOption);

  const goalOptions = goalsForTransfer.map((g) => ({ value: g.id, label: g.name }));

  // Earning → only income categories (group 'earning'); spending → everything else.
  const categoryOptions = categories
    .filter((c) => (txType === "earning" ? c.group_name === "earning" : c.group_name !== "earning"))
    .map((c) => ({
      value: c.id,
      label: c.name,
      group: c.group_name,
    }));

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    const num = parseInt(raw || "0", 10);
    setRawAmount(raw);
    setDisplayAmount(raw ? formatCurrency(num) : "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(rawAmount || "0", 10);
    if (!amount || amount <= 0) return;
    if (!accountId) return;
    if (!date) return;

    if (!note.trim()) return;

    // Cleared optional fields send null (not undefined) so edit persists the clear —
    // undefined is stripped by zod .partial(), leaving the old value in place.
    const submitData: UpdateTransactionInput = {
      transaction_date: date,
      transaction_type: txType,
      account_id: accountId,
      to_account_id: txType === "transfer" ? toAccountId || null : null,
      goal_id: txType === "transfer" ? goalId || null : null,
      category_id: txType !== "transfer" ? categoryId || null : null,
      amount,
      note: note.trim(),
    };
    onSubmit(submitData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type pill selector */}
      <div className="flex gap-2">
        {(["spending", "earning", "transfer"] as TxType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTxType(t);
              setCategoryId("");
            }}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-semibold transition-colors",
              txType === t ? TYPE_ACTIVE[t] : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <Input
        type="date"
        label="Tanggal"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      {/* Row 1: Akun + Kategori (or Ke Akun for transfer) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Akun <span className="text-red-500">*</span></label>
          <SingleSelect
            options={accountOptions}
            value={accountId}
            onChange={setAccountId}
            placeholder={accounts.length === 0 ? "Belum ada akun" : "Pilih akun"}
            searchable
            direction="up"
          />
        </div>
        {txType === "transfer" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Ke Akun <span className="text-red-500">*</span></label>
            <SingleSelect
              options={toAccountOptions}
              value={toAccountId}
              onChange={setToAccountId}
              placeholder="Pilih tujuan"
              searchable
              direction="up"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Kategori</label>
            <SingleSelect
              options={categoryOptions}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Tanpa kategori"
              searchable
              direction="up"
            />
          </div>
        )}
      </div>

      {/* Untuk Goal / From Goal — opsional, transfer & spending */}
      {(txType === "transfer" || txType === "spending") && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            {txType === "transfer" ? "Untuk Goal" : "From Goal"} <span className="text-gray-400 text-xs">(opsional)</span>
          </label>
          <SingleSelect
            options={goalOptions}
            value={goalId}
            onChange={setGoalId}
            placeholder="Tanpa goal"
            searchable
            direction="up"
          />
        </div>
      )}

      {/* Row 2: Catatan + Jumlah */}
      <div className="grid grid-cols-2 gap-3">
        {/* Jumlah — dual-state raw/display */}
        <Input
          type="text"
          label="Catatan"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Makan siang"
          maxLength={200}
          required
        />
        <Input
          type="tel"
          inputMode="numeric"
          label="Jumlah"
          value={displayAmount}
          onChange={handleAmountChange}
          placeholder="Rp 0"
          required
          className="font-semibold"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={isPending || !rawAmount}
        className="w-full py-3 rounded-xl"
      >
        {isPending ? "Menyimpan\u2026" : "Simpan"}
      </Button>
    </form>
  );
}
