// Helper finansial — diport dari prj-better-finance/utils/helper.js
// Diubah ke TypeScript dengan tipe eksplisit

// ── Currency ──────────────────────────────────────────────────────────────────

export type CurrencyFormat = "rupiah" | "brackets" | "signs" | "short" | "superscript";

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrency(amount: number, format: CurrencyFormat = "rupiah"): string {
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  const sign = isNegative ? "-" : "";

  switch (format) {
    case "rupiah":
      return formatRupiah(amount);

    case "brackets":
      return isNegative ? `(${formatRupiah(absAmount)})` : formatRupiah(amount);

    case "signs":
      return `${isNegative ? "-" : "+"}${formatRupiah(absAmount)}`;

    case "short": {
      if (absAmount >= 1_000_000_000) {
        const val = (absAmount / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
        return `${sign}Rp${val}M`;
      }
      if (absAmount >= 1_000_000) {
        const val = (absAmount / 1_000_000).toFixed(1).replace(/\.0$/, "");
        return `${sign}Rp${val}jt`;
      }
      if (absAmount >= 1_000) {
        const val = (absAmount / 1_000).toFixed(1).replace(/\.0$/, "");
        return `${sign}Rp${val}rb`;
      }
      return `${sign}Rp${absAmount}`;
    }

    case "superscript": {
      const str = new Intl.NumberFormat("id-ID").format(Math.floor(absAmount));
      const remainder = Math.round((absAmount % 1) * 100);
      // Selalu tampil superscript (termasuk "00" untuk bilangan bulat) — sesuai v1
      return `${sign}Rp ${str}<sup>${remainder.toString().padStart(2, "0")}</sup>`;
    }

    default:
      return formatRupiah(amount);
  }
}

// ── Dates ─────────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? parseDate(dateStr) : dateStr;
  if (!date) return String(dateStr);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function parseDate(str: string): Date | null {
  // Support DD/MM/YYYY (Sheets format) and ISO (Supabase format)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return new Date(`${y}-${m}-${d}`);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatLastUpdated(isoTime: string | Date): string {
  const date = typeof isoTime === "string" ? new Date(isoTime) : isoTime;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) {
    const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    return `${diffDay}d ago (${dateStr})`;
  }
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function getCurrentWeek(date: Date = new Date()): {
  week: number;
  month: number;
  year: number;
  startDate: Date;
  endDate: Date;
} {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  const firstOfMonth = new Date(year, month, 1);
  // Week 1 starts on the first Monday on or before the 1st
  const firstMonday = new Date(firstOfMonth);
  const dayOfWeek = firstOfMonth.getDay(); // 0=Sun, 1=Mon, ...
  if (dayOfWeek !== 1) {
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    firstMonday.setDate(firstOfMonth.getDate() + daysToMonday);
  }

  const diffMs = date.getTime() - firstMonday.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.min(Math.floor(diffDays / 7) + 1, 4);

  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return { week, month: month + 1, year, startDate: weekStart, endDate: weekEnd };
}

// ── Color logic ───────────────────────────────────────────────────────────────

export interface StatusColors {
  text: string;
  progress: string;
  status: string;
  statusBg: string;
}

export function getBudgetColors(percent: number): StatusColors {
  if (percent <= 80) {
    return {
      text: "text-green-600",
      progress: "bg-green-500",
      status: "On Track",
      statusBg: "bg-green-100 text-green-700",
    };
  }
  if (percent <= 100) {
    return {
      text: "text-yellow-600",
      progress: "bg-yellow-400",
      status: "Warning",
      statusBg: "bg-yellow-100 text-yellow-700",
    };
  }
  return {
    text: "text-red-600",
    progress: "bg-red-500",
    status: "Over Budget",
    statusBg: "bg-red-100 text-red-700",
  };
}

export function getGoalColors(progress: number): StatusColors {
  if (progress >= 80) {
    return {
      text: "text-green-600",
      progress: "bg-green-500",
      status: "Ahead",
      statusBg: "bg-green-100 text-green-700",
    };
  }
  if (progress >= 50) {
    return {
      text: "text-yellow-600",
      progress: "bg-yellow-400",
      status: "On Track",
      statusBg: "bg-yellow-100 text-yellow-700",
    };
  }
  return {
    text: "text-red-600",
    progress: "bg-red-500",
    status: "Behind",
    statusBg: "bg-red-100 text-red-700",
  };
}

// ── String ────────────────────────────────────────────────────────────────────

export function toProperCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
