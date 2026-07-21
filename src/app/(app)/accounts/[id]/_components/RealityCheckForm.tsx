"use client";

import { formatCurrency } from "@/lib/helper";

interface Props {
  accountName: string;
  value: string;
  displayValue: string;
  onChange: (raw: string, display: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  lastResult: "success" | "error" | null;
  successAmount?: number | null;
  successDiff?: number | null;
  errorMessage?: string;
}

export function RealityCheckForm({
  accountName,
  value,
  displayValue,
  onChange,
  onSubmit,
  isPending,
  lastResult,
  successAmount,
  successDiff,
  errorMessage,
}: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Support format Indonesia: digit + opsional koma + max 2 desimal
    const input = e.target.value;
    const cleaned = input.replace(/[^\d,]/g, "");

    const parts = cleaned.split(",");
    const intPart = parts[0] ?? "";
    const decPart = parts.length > 1 ? (parts[1] ?? "").slice(0, 2) : null;

    if (!intPart && decPart === null) {
      onChange("", "");
      return;
    }

    // raw: JS float string (dot separator)
    const raw = decPart !== null ? `${intPart || "0"}.${decPart}` : intPart;
    const numInt = parseInt(intPart || "0", 10);

    // display: angka saja (tanpa "Rp ") + koma desimal jika ada
    const baseNum = intPart ? new Intl.NumberFormat("id-ID").format(numInt) : "";
    let display = baseNum;
    if (decPart !== null) {
      display = `${baseNum || "0"},${decPart}`;
    }

    onChange(raw, display);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <>
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-700">
          Actual {accountName}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Enter the balance you counted physically
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {/* Input */}
        <div>
          <input
            type="tel"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            placeholder="Rp 0"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!value || isPending}
          className="w-full bg-linear-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Updating…" : `Update ${accountName}`}
        </button>
      </form>
    </div>

    {/* Results */}
    <div>
      {/* Success state */}
      {lastResult === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-green-700 text-lg font-semibold mb-2">✅ Updated Successfully!</span>
          </div>
          <div className="space-y-2">
          {successAmount != null && (
            <p className="text-green-600 text-sm">
              Actual {accountName} updated to {formatCurrency(successAmount)}
            </p>
          )}
          {successDiff != null && (
            <p className="text-green-600 text-sm">
              Difference: {successDiff >= 0 ? "+" : ""}{formatCurrency(successDiff)}
            </p>
          )}
          </div>
        </div>
      )}

      {/* Error state */}
      {lastResult === "error" && errorMessage && (
        <p className="text-red-600 text-sm">❌ {errorMessage}</p>
      )}
    </div>
    </>
  );
}
