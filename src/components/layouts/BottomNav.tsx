"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ArrowLeftRight, PieChart, Target, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const NAV_ITEMS = [
  { href: "/", key: "home", icon: Home },
  { href: "/transactions", key: "transactions", icon: ArrowLeftRight },
  { href: "/budgets", key: "budgets", icon: PieChart },
  { href: "/goals", key: "goals", icon: Target },
  { href: "/wishlist", key: "wishlist", icon: ShoppingBag },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10 bg-white/80 backdrop-blur-xl border-t border-gray-200">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors",
                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-xs font-medium">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
