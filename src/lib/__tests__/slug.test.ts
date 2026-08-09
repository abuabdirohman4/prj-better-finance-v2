import { describe, it, expect } from "vitest";
import { toSlug } from "../slug";

describe("toSlug", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(toSlug("Dining Out")).toBe("dining-out");
  });
  it("strips non-alphanumeric, collapses hyphens", () => {
    expect(toSlug("  Food & Drinks!! ")).toBe("food-drinks");
  });
  it("handles already-slug", () => {
    expect(toSlug("transport")).toBe("transport");
  });
  it("empty-ish returns empty string", () => {
    expect(toSlug("  ")).toBe("");
  });
});
