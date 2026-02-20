import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createReversiMove } from "../index.js";

beforeAll(() => {
  vi.spyOn(performance, "now").mockReturnValue(0);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("Reversi Domain", () => {
  it("should validate move format", () => {
    const move = createReversiMove("d3");
    expect(move).toBe("d3");
  });

  it("should throw on invalid injection characters", () => {
    expect(() => createReversiMove("d3\0")).toThrow();
  });
});
