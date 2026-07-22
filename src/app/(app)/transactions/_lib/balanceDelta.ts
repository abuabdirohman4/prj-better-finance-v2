export interface BalanceDelta {
  account_id: string;
  delta: number;
}

export function calcUpdateDeltas(
  old: {
    account_id: string;
    to_account_id: string | null;
    transaction_type: "spending" | "earning" | "transfer";
    amount: number;
  },
  next: {
    account_id: string;
    to_account_id: string | null;
    transaction_type: "spending" | "earning" | "transfer";
    amount: number;
  }
): BalanceDelta[] {
  const deltas: BalanceDelta[] = [];

  // Reverse old
  const oldReverse = old.transaction_type === "earning" ? -old.amount : old.amount;
  deltas.push({ account_id: old.account_id, delta: oldReverse });
  if (old.transaction_type === "transfer" && old.to_account_id) {
    deltas.push({ account_id: old.to_account_id, delta: -old.amount });
  }

  // Apply new
  const newDelta = next.transaction_type === "earning" ? next.amount : -next.amount;
  deltas.push({ account_id: next.account_id, delta: newDelta });
  if (next.transaction_type === "transfer" && next.to_account_id) {
    deltas.push({ account_id: next.to_account_id, delta: next.amount });
  }

  return deltas;
}
