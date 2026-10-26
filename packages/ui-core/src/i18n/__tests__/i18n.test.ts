import { describe, expect, it } from "vitest";
import { createUIStrings } from "../../index.js";

describe("literal UI translation parameters", () => {
  it.each(["$&", "$$", "$`", "$'", "$1", "price $& $$"])(
    "preserves %s in move and engine descriptions",
    (value) => {
      const strings = createUIStrings({ engine: {} });
      expect(strings.moveAriaLabel(value)).toBe(`Move ${value}`);
      expect(strings.engineVersion(value, value)).toBe(`${value} v${value}`);
    },
  );

  it("retains numeric formatting", () => {
    const strings = createUIStrings({ engine: {} });
    expect(strings.mateIn(3)).toBe("Mate in 3");
    expect(strings.advantage("plus", 125)).toBe("+1.25");
    expect(strings.advantage("minus", 125)).toBe("-1.25");
    expect(strings.advantage("neutral", 0)).toBe("Even");
    expect(strings.pvCount(2)).toBe("N=2");
    expect(strings.logCount(4)).toBe("4 entries");
    expect(strings.engineBridgeStandard(2026)).toBe(
      "2026 Engine Bridge Standard",
    );
  });
});
