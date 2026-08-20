"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = {
  en: "English",
  id: "Indonesia",
};

export function LocaleSwitcher() {
  const active = useLocale() as Locale;
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="font-semibold text-gray-900 mb-3">{t("language")}</p>
      <div className="flex gap-2">
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => setLocale(loc))}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer",
              active === loc
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {LABELS[loc]}
          </button>
        ))}
      </div>
    </div>
  );
}
