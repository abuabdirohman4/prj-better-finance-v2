"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/signin/actions";
import { Avatar } from "@/components/ui/Avatar";
import { useDashboard } from "../_hooks/useDashboard";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

export default function SettingsPage() {
  const { data, isLoading } = useDashboard();
  const t = useTranslations("settings");

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
        <Avatar
          src={data?.user.avatarUrl}
          initials={data?.user.initials ?? ".."}
          className="w-14 h-14 bg-blue-100 text-blue-700 text-lg"
        />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {isLoading ? "..." : data?.user.displayName}
          </p>
          <p className="text-sm text-gray-500 truncate">{data?.user.email}</p>
        </div>
      </div>

      <LocaleSwitcher />

      <form action={signOut}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-3 rounded-2xl text-sm font-medium hover:bg-red-50 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}
