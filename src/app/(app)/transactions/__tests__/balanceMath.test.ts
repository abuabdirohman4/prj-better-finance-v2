import { describe, it, expect } from "vitest";
import { calcUpdateDeltas } from "../_lib/balanceDelta";

const ACC_A = "acc-a";
const ACC_B = "acc-b";

describe("calcUpdateDeltas", () => {
  it("earning → spending: reverse earning, apply spending", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: null, transaction_type: "earning", amount: 1000 },
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 500 }
    );
    // Reverse earning: -1000. Apply spending: -500
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: -1000 });
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: -500 });
  });

  it("spending → transfer: reverse spending, debit + credit", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 1000 },
      { account_id: ACC_A, to_account_id: ACC_B, transaction_type: "transfer", amount: 800 }
    );
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: 1000 });  // reverse spending
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: -800 });  // apply transfer debit
    expect(deltas).toContainEqual({ account_id: ACC_B, delta: 800 });   // apply transfer credit
  });

  it("transfer → earning: reverse both sides, apply earning", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: ACC_B, transaction_type: "transfer", amount: 500 },
      { account_id: ACC_A, to_account_id: null, transaction_type: "earning", amount: 600 }
    );
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: 500 });   // reverse transfer debit
    expect(deltas).toContainEqual({ account_id: ACC_B, delta: -500 });  // reverse transfer credit
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: 600 });   // apply earning
  });

  it("edit amount only: same type", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 1000 },
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 1500 }
    );
    // Net: +1000 (reverse) -1500 (apply) = -500 net on ACC_A
    const netA = deltas.filter(d => d.account_id === ACC_A).reduce((s, d) => s + d.delta, 0);
    expect(netA).toBe(-500);
  });

  it("edit account: move spending from A to B", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 200 },
      { account_id: ACC_B, to_account_id: null, transaction_type: "spending", amount: 200 }
    );
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: 200 });   // reverse old
    expect(deltas).toContainEqual({ account_id: ACC_B, delta: -200 });  // apply new
  });
});
