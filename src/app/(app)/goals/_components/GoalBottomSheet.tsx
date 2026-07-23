"use client";

import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { SingleSelect } from "@/components/ui/MultiSelect";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { GoalRow } from "@/db/queries/goals";
import type { CreateGoalInput } from "@/lib/schemas/goal";
import type { AccountRow } from "@/db/queries/accounts";
import { formatCurrency } from "@/lib/helper";

interface Props {
  open: boolean;
  onClose: () => void;
  goal: GoalRow | null; // null = create mode
  accounts: AccountRow[];
  onSave: (input: CreateGoalInput & { collected_amount?: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function GoalBottomSheet({ open, onClose, goal, accounts, onSave, onDelete }: Props) {
  const [name, setName] = useState("");
  const [goalType, setGoalType] = useState<"Saving" | "Investing">("Saving");
  const [targetAmountRaw, setTargetAmountRaw] = useState("");
  const [targetAmountDisplay, setTargetAmountDisplay] = useState("");
  const [collectedAmountRaw, setCollectedAmountRaw] = useState("");
  const [collectedAmountDisplay, setCollectedAmountDisplay] = useState("");
  const [monthlyContributionRaw, setMonthlyContributionRaw] = useState("");
  const [monthlyContributionDisplay, setMonthlyContributionDisplay] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) {
      setName(goal?.name || "");
      setGoalType((goal?.goal_type as "Saving" | "Investing") || "Saving");
      
      setTargetAmountRaw(goal ? String(goal.target_amount) : "");
      setTargetAmountDisplay(goal ? formatCurrency(goal.target_amount) : "");
      
      setCollectedAmountRaw(goal ? String(goal.collected_amount) : "");
      setCollectedAmountDisplay(goal ? formatCurrency(goal.collected_amount) : "");
      
      setMonthlyContributionRaw(goal?.monthly_contribution ? String(goal.monthly_contribution) : "");
      setMonthlyContributionDisplay(goal?.monthly_contribution ? formatCurrency(goal.monthly_contribution) : "");
      
      setDeadlineDate(goal?.deadline_date || "");
      setLinkedAccountId(goal?.linked_account_id || "");
      
      setErrorMsg("");
      setIsSubmitting(false);
    }
  }, [open, goal]);

  const handleAmountChange = (val: string, setRaw: (v: string) => void, setDisp: (v: string) => void) => {
    const numStr = val.replace(/\D/g, "");
    setRaw(numStr);
    setDisp(numStr ? formatCurrency(Number(numStr)) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!name.trim()) return setErrorMsg("Nama goal harus diisi");
    if (!targetAmountRaw) return setErrorMsg("Target amount harus diisi");

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        goal_type: goalType,
        target_amount: Number(targetAmountRaw),
        collected_amount: collectedAmountRaw ? Number(collectedAmountRaw) : 0,
        monthly_contribution: monthlyContributionRaw ? Number(monthlyContributionRaw) : null,
        deadline_date: deadlineDate || null,
        linked_account_id: linkedAccountId || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!goal || !window.confirm("Hapus goal ini?")) return;
    setIsSubmitting(true);
    try {
      await onDelete(goal.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghapus");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 shadow-2xl transition-transform duration-300 ease-out`}
        style={{ transform: open ? "translate(-50%, 0)" : "translate(-50%, 100%)" }}
      >
        <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        <div className="px-6 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {goal ? "Edit Goal" : "New Goal"}
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 pb-8 scrollbar-hide">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Goal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dana Darurat"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Goal</label>
              <SingleSelect
                options={[
                  { value: "Saving", label: "Saving" },
                  { value: "Investing", label: "Investing" },
                ]}
                value={goalType}
                onChange={(val) => setGoalType(val as "Saving" | "Investing")}
                placeholder="Pilih tipe"
                direction="down"
              />
            </div>

            <Input
              label="Target Goal"
              value={targetAmountDisplay}
              onChange={(e) => handleAmountChange(e.target.value, setTargetAmountRaw, setTargetAmountDisplay)}
              placeholder="Rp 0"
              inputMode="numeric"
            />

            {goal && (
              <Input
                label="Uang Terkumpul Saat Ini"
                value={collectedAmountDisplay}
                onChange={(e) => handleAmountChange(e.target.value, setCollectedAmountRaw, setCollectedAmountDisplay)}
                placeholder="Rp 0"
                inputMode="numeric"
              />
            )}

            <Input
              label="Kontribusi Bulanan (Opsional)"
              value={monthlyContributionDisplay}
              onChange={(e) => handleAmountChange(e.target.value, setMonthlyContributionRaw, setMonthlyContributionDisplay)}
              placeholder="Rp 0"
              inputMode="numeric"
            />

            <Input
              label="Tanggal Target / Deadline (Opsional)"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Akun Terhubung (Opsional)</label>
              <SingleSelect
                options={accounts.map(a => ({ value: a.id, label: a.name }))}
                value={linkedAccountId}
                onChange={setLinkedAccountId}
                placeholder="Pilih akun..."
                direction="up"
              />
              <p className="text-xs text-gray-400 mt-1">Goal ini hanya untuk pencatatan (progress di-update manual), menghubungkan akun tidak otomatis memotong saldo.</p>
            </div>

            <div className="pt-4 flex gap-3">
              {goal && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Menyimpan..." : "Simpan Goal"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
