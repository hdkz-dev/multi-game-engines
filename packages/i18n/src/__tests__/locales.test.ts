import { describe, it, expect } from "vitest";
import { locales } from "../index.js";

// Flatten keys helper
function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      keys = keys.concat(flattenKeys(value as Record<string, unknown>, newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

describe("i18n Locales", () => {
  it("should have matching keys between ja and en", () => {
    const jaKeys = flattenKeys(locales.ja).sort();
    const enKeys = flattenKeys(locales.en).sort();

    expect(jaKeys).toEqual(enKeys);
  });

  it("should contain essential engine labels", () => {
    const engineStrings = locales.ja.engine;
    expect(engineStrings.title).toBeDefined();
    expect(engineStrings.start).toBeDefined();
    expect(engineStrings.stop).toBeDefined();
  });
});
