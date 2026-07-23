"use client";

import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1 cursor-pointer">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`cursor-pointer ${
              danger ? "flex-1 bg-red-600 hover:bg-red-700" : "flex-1"
            }`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
