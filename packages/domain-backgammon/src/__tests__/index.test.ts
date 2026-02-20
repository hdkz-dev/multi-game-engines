import { describe, it, expect } from "vitest";
import { createBackgammonMove } from "../index.js";

describe("Backgammon Domain", () => {
  it("should validate move format", () => {
    const move = createBackgammonMove("24/18 18/13");
    expect(move).toBe("24/18 18/13");
  });

  it("should throw on invalid injection characters", () => {
    expect(() => createBackgammonMove("24/18\nstop")).toThrow();
  });
});
