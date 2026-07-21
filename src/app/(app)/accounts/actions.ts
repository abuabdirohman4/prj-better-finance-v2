"use server";

import { getAccountsWithType, type AccountRow } from "@/db/queries/accounts";
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
