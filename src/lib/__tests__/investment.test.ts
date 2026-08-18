import { describe, expect, it } from "vitest";
import { deriveInvestmentGroup, productLabel } from "../investment";

describe("deriveInvestmentGroup", () => {
  it("maps every RD* prefix to Reksadana", () => {
    expect(deriveInvestmentGroup("RDPU : Trimegah Kas Syariah")).toBe("Reksadana");
    expect(deriveInvestmentGroup("RDPT : BNI-AM Ardhani")).toBe("Reksadana");
    expect(deriveInvestmentGroup("RDS : BRI Indeks Syariah")).toBe("Reksadana");
  });

  it("uses the prefix as-is for other groups", () => {
    expect(deriveInvestmentGroup("Emas : Antam 1g")).toBe("Emas");
    expect(deriveInvestmentGroup("BPJS : JHT")).toBe("BPJS");
    expect(deriveInvestmentGroup('Emas : Anting "Toge"')).toBe("Emas");
  });

  it("returns null when the name has no group prefix", () => {
    expect(deriveInvestmentGroup("Jago")).toBeNull();
    expect(deriveInvestmentGroup(" : orphan")).toBeNull();
  });
});

describe("productLabel", () => {
  it("strips the group prefix", () => {
    expect(productLabel("Emas : Antam 1g")).toBe("Antam 1g");
    expect(productLabel("RDPU : Trimegah Kas Syariah")).toBe("Trimegah Kas Syariah");
  });

  it("falls back to the full name when there is nothing to strip", () => {
    expect(productLabel("Jago")).toBe("Jago");
    expect(productLabel("Emas :")).toBe("Emas :");
  });
});
