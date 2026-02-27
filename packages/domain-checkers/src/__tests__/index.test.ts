import { describe, it, expect } from "vitest";
import { createCheckersMove } from "../index.js";

describe("Checkers Domain", () => {
  it("should validate move format", () => {
    const move = createCheckersMove("11-15");
    expect(move).toBe("11-15");
  });

  it("should throw on invalid injection characters", () => {
    expect(() => createCheckersMove("11-15;stop")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
  });
});
