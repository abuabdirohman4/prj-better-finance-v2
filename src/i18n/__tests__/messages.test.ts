import { describe, it, expect } from "vitest";
import en from "../messages/en.json";
import id from "../messages/id.json";

function flatKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null
      ? flatKeys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

describe("message catalogs", () => {
  it("en and id have identical keys", () => {
    const enKeys = flatKeys(en).sort();
    const idKeys = flatKeys(id).sort();
    expect(idKeys.filter((k) => !enKeys.includes(k))).toEqual([]); // extra in id
    expect(enKeys.filter((k) => !idKeys.includes(k))).toEqual([]); // missing from id
  });

  it("has no empty message values", () => {
    for (const [locale, msgs] of [["en", en], ["id", id]] as const) {
      const empty = flatKeys(msgs).filter((path) => {
        const val = path.split(".").reduce<any>((o, k) => o?.[k], msgs);
        return typeof val !== "string" || val.trim() === "";
      });
      expect(empty, `${locale} has empty values`).toEqual([]);
    }
  });
});
