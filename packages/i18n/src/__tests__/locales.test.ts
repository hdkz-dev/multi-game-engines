import { describe, it, expect } from "vitest";
import { locales } from "../index.js";

describe("i18n Locales", () => {
  it("should have matching keys between ja and en", () => {
    const jaKeys = Object.keys(locales.ja.engine).sort();
    const enKeys = Object.keys(locales.en.engine).sort();

    expect(jaKeys).toEqual(enKeys);
  });

  it("should contain essential engine labels", () => {
    const engineStrings = locales.ja.engine;
    expect(engineStrings.title).toBeDefined();
    expect(engineStrings.start).toBeDefined();
    expect(engineStrings.stop).toBeDefined();
  });
});
