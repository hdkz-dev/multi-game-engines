import { describe, it, expect } from "vitest";
import { createReversiMove } from "../index.js";

describe("Reversi Domain", () => {
  it("should validate move format", () => {
    const move = createReversiMove("d3");
    expect(move).toBe("d3");
  });

  it("should throw on invalid injection characters", () => {
    expect(() => createReversiMove("d3\0")).toThrow();
  });
});
