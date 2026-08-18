import { describe, expect, it } from "vitest";
import { groupOptions, matchesSearch, type MultiSelectOption } from "../MultiSelect";

const options: MultiSelectOption[] = [
  { value: "1", label: "Mandiri" },
  { value: "2", label: "Trimegah Kas Syariah", group: "Reksadana" },
  { value: "3", label: "BCA" },
  { value: "4", label: "Antam 1g", group: "Emas" },
];

describe("matchesSearch", () => {
  it("matches on the option label", () => {
    expect(matchesSearch(options[1], "trimegah")).toBe(true);
  });

  it("matches on the group name so collapsed groups stay findable", () => {
    // Label sudah dipendekkan jadi "Antam 1g" — tanpa ini, cari "Emas" tak ketemu apa-apa.
    expect(matchesSearch(options[3], "emas")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesSearch(options[0], "emas")).toBe(false);
  });
});

describe("groupOptions", () => {
  it("puts ungrouped options first, then keeps group order", () => {
    const grouped = groupOptions(options);
    expect(grouped.map((g) => g.group)).toEqual(["", "Reksadana", "Emas"]);
    expect(grouped[0].items.map((o) => o.label)).toEqual(["Mandiri", "BCA"]);
  });

  it("keeps every option exactly once", () => {
    expect(groupOptions(options).flatMap((g) => g.items)).toHaveLength(options.length);
  });
});
