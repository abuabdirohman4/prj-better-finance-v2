"use server";

import { requireUser } from "@/lib/accessControlServer";
import type { ServerActionResult } from "@/lib/errorUtils";
import {
  getWalletDenominations,
  upsertWalletDenominations,
  VALID_DENOMINATIONS_BY_TYPE,
  type WalletDenominationRow,
} from "@/db/queries/walletDenominations";
import { getAccountById } from "@/db/queries/accounts";

export async function getWalletDenominationsAction(
  accountId: string
): Promise<ServerActionResult<WalletDenominationRow[]>> {
  try {
    const user = await requireUser();
    // Verifikasi ownership akun + pastikan is_wallet
    const account = await getAccountById(user.id, accountId);
    if (!account) return { success: false, message: "Akun tidak ditemukan" };
    if (!account.is_wallet) return { success: false, message: "Bukan akun wallet" };
    const data = await getWalletDenominations(user.id, accountId);
    return { success: true, data };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Gagal memuat" };
  }
}

export async function upsertWalletDenominationsAction(
  accountId: string,
  rows: { denomination: number; note_type: string; count: number }[]
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    const account = await getAccountById(user.id, accountId);
    if (!account) return { success: false, message: "Akun tidak ditemukan" };
    if (!account.is_wallet) return { success: false, message: "Bukan akun wallet" };

    // Validasi setiap row di server (form bisa di-bypass)
    for (const row of rows) {
      if (row.count < 0) return { success: false, message: "Jumlah tidak boleh negatif" };
      const valid = VALID_DENOMINATIONS_BY_TYPE[row.note_type];
      if (!valid || !valid.includes(row.denomination)) {
        return { success: false, message: `Pecahan tidak valid: ${row.denomination}` };
      }
    }

    await upsertWalletDenominations(user.id, accountId, rows);
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Gagal menyimpan" };
  }
}
