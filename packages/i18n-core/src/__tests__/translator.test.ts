import { describe, it, expect } from "vitest";
import { createTranslator, getObjectPath } from "../index.js";

describe("createTranslator", () => {
  const locales = {
    en: {
      simple: "Hello",
      nested: {
        key: "World",
      },
      params: "Hello {name}",
      multiple: "{a} and {b}",
    },
    ja: {
      simple: "こんにちは",
      nested: {
        key: "世界",
      },
      params: "こんにちは {name} さん",
    },
  };

  it("should translate simple keys", () => {
    const tEn = createTranslator(locales.en);
    const tJa = createTranslator(locales.ja);

    expect(tEn("simple")).toBe("Hello");
    expect(tJa("simple")).toBe("こんにちは");
  });

  it("should translate nested keys", () => {
    const tEn = createTranslator(locales.en);
    expect(tEn("nested.key")).toBe("World");
  });

  it("should replace parameters", () => {
    const tEn = createTranslator(locales.en);
    const tJa = createTranslator(locales.ja);

    expect(tEn("params", { name: "Alice" })).toBe("Hello Alice");
    expect(tJa("params", { name: "Alice" })).toBe("こんにちは Alice さん");
  });

  it.each(["$&", "$$", "$`", "$'", "$1", "price $& $$"])(
    "preserves literal replacement value %s",
    (name) => {
      const translate = createTranslator({
        greeting: "Hello {name} / {name}!",
      });
      expect(translate("greeting", { name })).toBe(`Hello ${name} / ${name}!`);
    },
  );

  it("should replace multiple parameters", () => {
    const tEn = createTranslator(locales.en);
    expect(tEn("multiple", { a: "One", b: "Two" })).toBe("One and Two");
  });

  it("should return key if translation is missing", () => {
    const tEn = createTranslator(locales.en);
    expect(tEn("missing")).toBe("missing");
  });

  it("should handle deep nesting", () => {
    const deepLocales = {
      en: {
        a: { b: { c: { d: "Found" } } },
      },
    };
    const t = createTranslator(deepLocales.en);
    expect(t("a.b.c.d")).toBe("Found");
  });
});

describe("getObjectPath", () => {
  it("should return undefined when intermediate key is not an object", () => {
    expect(getObjectPath({ a: "string" }, "a.b")).toBeUndefined();
  });

  it("should return undefined for null input", () => {
    expect(getObjectPath(null, "a")).toBeUndefined();
  });
});
