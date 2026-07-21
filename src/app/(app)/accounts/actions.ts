"use server";

import {
  getAccountsWithType,
  getAccountTypes,
  createAccount,
  updateAccount,
  deactivateAccount,
  type AccountRow,
  type CreateAccountInput,
  type UpdateAccountInput,
} from "@/db/queries/accounts";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";

export async function getAccounts(): Promise<ServerActionResult<AccountRow[]>> {
  try {
    const user = await requireUser();
    const data = await getAccountsWithType(user.id);
    return { success: true, data };
  } catch (error) {
    const info = handleApiError(error, "memuat data");
    return { success: false, message: info.message };
  }
}

export async function getAccountTypesAction(): Promise<
  ServerActionResult<{ id: string; name: string; slug: string }[]>
> {
  try {
    const user = await requireUser();
    const data = await getAccountTypes(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}

export async function createAccountAction(
  input: CreateAccountInput
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const id = await createAccount(user.id, input);
    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menyimpan data").message };
  }
}

export async function updateAccountAction(
  accountId: string,
  input: UpdateAccountInput
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    await updateAccount(user.id, accountId, input);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "mengupdate data").message };
  }
}

export async function deleteAccountAction(
  accountId: string
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    await deactivateAccount(user.id, accountId);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menghapus data").message };
  }
}
