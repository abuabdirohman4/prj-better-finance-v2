"use server";

import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  softDeleteTransaction,
  type TransactionRow,
  type TransactionFilters,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "@/db/queries/transactions";
import { adjustAccountBalance, getAccountById, getCategories, type CategoryRow } from "@/db/queries/accounts";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";

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

    // Validate account ownership before inserting
    const sourceAccount = await getAccountById(user.id, input.account_id);
    if (!sourceAccount) return { success: false, message: "Akun tidak ditemukan." };

    if (input.transaction_type === "transfer" && input.to_account_id) {
      const destAccount = await getAccountById(user.id, input.to_account_id);
      if (!destAccount) return { success: false, message: "Akun tujuan tidak ditemukan." };
    }

    const id = await createTransaction(user.id, input);

    // ponytail: balance updates are 3 sequential awaits with no rollback — Supabase transaction
    // mode (pgBouncer port 6543) blocks BEGIN/SAVEPOINT. Switch to session mode (port 5432) if
    // atomicity becomes a hard requirement.
    const delta = input.transaction_type === "earning" ? input.amount : -input.amount;
    await adjustAccountBalance(user.id, input.account_id, delta);

    if (input.transaction_type === "transfer" && input.to_account_id) {
      await adjustAccountBalance(user.id, input.to_account_id, input.amount);
    }

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

    // Reverse old balance effect
    const oldReverseDelta = old.transaction_type === "earning" ? -old.amount : old.amount;
    await adjustAccountBalance(user.id, old.account_id, oldReverseDelta);
    if (old.transaction_type === "transfer" && old.to_account_id) {
      await adjustAccountBalance(user.id, old.to_account_id, -old.amount);
    }

    // Apply new balance effect
    const newType = input.transaction_type ?? old.transaction_type;
    const newAmount = input.amount ?? old.amount;
    const newAccountId = input.account_id ?? old.account_id;
    const newToAccountId = "to_account_id" in input ? input.to_account_id : old.to_account_id;

    const newDelta = newType === "earning" ? newAmount : -newAmount;
    await adjustAccountBalance(user.id, newAccountId, newDelta);
    if (newType === "transfer" && newToAccountId) {
      await adjustAccountBalance(user.id, newToAccountId, newAmount);
    }

    await updateTransaction(user.id, txId, input);
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
    const tx = await getTransactionById(user.id, txId);
    if (!tx) return { success: false, message: "Transaksi tidak ditemukan." };

    // Reverse balance before soft-deleting
    const reverseDelta = tx.transaction_type === "earning" ? -tx.amount : tx.amount;
    await adjustAccountBalance(user.id, tx.account_id, reverseDelta);

    if (tx.transaction_type === "transfer" && tx.to_account_id) {
      await adjustAccountBalance(user.id, tx.to_account_id, -tx.amount);
    }

    await softDeleteTransaction(user.id, txId);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menghapus data").message };
  }
}
