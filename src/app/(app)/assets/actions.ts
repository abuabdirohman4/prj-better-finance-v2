"use server";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";
import { getAssets, type AssetsSummary } from "@/db/queries/assets";

export async function getAssetsAction(): Promise<ServerActionResult<AssetsSummary>> {
  try {
    const user = await requireUser();
    const data = await getAssets(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
