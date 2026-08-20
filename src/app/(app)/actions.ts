"use server";

import { getDashboardData, type DashboardData } from "@/db/queries/accounts";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";

export interface DashboardPayload extends DashboardData {
  user: { displayName: string; initials: string; email: string; avatarUrl: string | null };
}

export async function getDashboard(): Promise<ServerActionResult<DashboardPayload>> {
  try {
    const user = await requireUser();
    const data = await getDashboardData(user.id);

    const displayName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "User";

    const avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null;

    return {
      success: true,
      data: {
        ...data,
        user: {
          displayName,
          initials: initials(displayName),
          email: user.email ?? "",
          avatarUrl,
        },
      },
    };
  } catch (error) {
    const info = handleApiError(error, "memuat data");
    return { success: false, message: info.message };
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
