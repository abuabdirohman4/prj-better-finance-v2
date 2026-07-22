"use server";
import { z } from "zod";

import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  softDeleteTransaction,
  type TransactionRow,
  type TransactionFilters,
} from "@/db/queries/transactions";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/lib/schemas/transaction";
import { getAccountById, getCategories, applyTransactionBalancesRpc, type CategoryRow } from "@/db/queries/accounts";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";
import { createTransactionSchema, updateTransactionSchema } from "@/lib/schemas/transaction";

export async function getTransactionsAction(
  filters: TransactionFilters = {}
): Promise<ServerActionResult<TransactionRow[]>> {
  try {
    const user = await requireUser();
    const data = await getTransactions(user.id, filters);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}

export async function getCategoriesAction(): Promise<ServerActionResult<CategoryRow[]>> {
  try {
    const user = await requireUser();
    const data = await getCategories(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}

export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const user = await requireUser();

    const parsed = createTransactionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }
    const validInput = parsed.data;

    // Validate account ownership before inserting
    const sourceAccount = await getAccountById(user.id, validInput.account_id);
    if (!sourceAccount) return { success: false, message: "Akun tidak ditemukan." };

    if (validInput.transaction_type === "transfer" && validInput.to_account_id) {
      if (validInput.account_id === validInput.to_account_id) {
        return { success: false, message: "Akun sumber dan tujuan tidak boleh sama." };
      }
      const destAccount = await getAccountById(user.id, validInput.to_account_id);
      if (!destAccount) return { success: false, message: "Akun tujuan tidak ditemukan." };
    }

    const id = await createTransaction(user.id, validInput);

    const delta = validInput.transaction_type === "earning" ? validInput.amount : -validInput.amount;
    const adjustments: { account_id: string; delta: number }[] = [
      { account_id: validInput.account_id, delta },
    ];
    if (validInput.transaction_type === "transfer" && validInput.to_account_id) {
      adjustments.push({ account_id: validInput.to_account_id, delta: validInput.amount });
    }
    await applyTransactionBalancesRpc(adjustments);

    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menyimpan data").message };
  }
}


export async function updateTransactionAction(
  txId: string,
  input: UpdateTransactionInput
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();

    // Fetch old transaction to reverse its balance effect
    const old = await getTransactionById(user.id, txId);
    if (!old) return { success: false, message: "Transaksi tidak ditemukan." };

    const parsed = updateTransactionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }
    const validInput = parsed.data;

    const newType = validInput.transaction_type ?? old.transaction_type;
    const newAmount = validInput.amount ?? old.amount;
    const newAccountId = validInput.account_id ?? old.account_id;
    const newToAccountId = "to_account_id" in validInput ? validInput.to_account_id : old.to_account_id;

    // All balance adjustments atomic via Postgres RPC
    const oldReverseDelta = old.transaction_type === "earning" ? -old.amount : old.amount;
    const newDelta = newType === "earning" ? newAmount : -newAmount;
    const adjustments: { account_id: string; delta: number }[] = [
      { account_id: old.account_id, delta: oldReverseDelta },
    ];
    if (old.transaction_type === "transfer" && old.to_account_id) {
      adjustments.push({ account_id: old.to_account_id, delta: -old.amount });
    }
    adjustments.push({ account_id: newAccountId, delta: newDelta });
    if (newType === "transfer" && newToAccountId) {
      adjustments.push({ account_id: newToAccountId, delta: newAmount });
    }
    await applyTransactionBalancesRpc(adjustments);

    await updateTransaction(user.id, txId, validInput);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "mengupdate data").message };
  }
}

export async function deleteTransactionAction(
  txId: string
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    const txIdParsed = z.string().uuid().safeParse(txId);
    if (!txIdParsed.success) return { success: false, message: "ID transaksi tidak valid." };
    const tx = await getTransactionById(user.id, txId);
    if (!tx) return { success: false, message: "Transaksi tidak ditemukan." };

    const reverseDelta = tx.transaction_type === "earning" ? -tx.amount : tx.amount;
    const adjustments: { account_id: string; delta: number }[] = [
      { account_id: tx.account_id, delta: reverseDelta },
    ];
    if (tx.transaction_type === "transfer" && tx.to_account_id) {
      adjustments.push({ account_id: tx.to_account_id, delta: -tx.amount });
    }
    await applyTransactionBalancesRpc(adjustments);

    await softDeleteTransaction(user.id, txId);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menghapus data").message };
  }
}
