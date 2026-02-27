import { describe, it, expect } from "vitest";
import en from "../../locales/en.json" with { type: "json" };
import ja from "../../locales/ja.json" with { type: "json" };

function getKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [];
  const record = obj as Record<string, unknown>;
  return Object.keys(record).reduce((res: string[], el) => {
    const val = record[el];
    if (Array.isArray(val)) {
      return res;
    } else if (typeof val === "object" && val !== null) {
      return [...res, ...getKeys(val, prefix + el + ".")];
    }
    return [...res, prefix + el];
  }, []);
}

describe("i18n key synchronization (chess)", () => {
  it("en and ja keys should match perfectly", () => {
    const enKeys = getKeys(en).sort();
    const jaKeys = getKeys(ja).sort();

    const missingInJa = enKeys.filter(k => !jaKeys.includes(k));
    const extraInJa = jaKeys.filter(k => !enKeys.includes(k));

    if (missingInJa.length > 0) {
      console.error("Keys missing in ja.json:", missingInJa);
    }
    if (extraInJa.length > 0) {
      console.error("Extra keys in ja.json (not in en.json):", extraInJa);
    }

    expect(missingInJa).toEqual([]);
    expect(extraInJa).toEqual([]);
  });
});
