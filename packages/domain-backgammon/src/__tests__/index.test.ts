import { describe, it, expect } from "vitest";
import { createBackgammonMove } from "../index.js";

describe("createBackgammonMove", () => {
  it("should create valid backgammon moves", () => {
    expect(createBackgammonMove("24/18")).toBe("24/18");
    expect(createBackgammonMove("24/18 18/13")).toBe("24/18 18/13");
  });

  it("should handle bar and off notation correctly", () => {
    expect(createBackgammonMove("bar/24")).toBe("bar/24");
    expect(createBackgammonMove("6/off")).toBe("6/off");
    expect(createBackgammonMove("bar/24 24/18")).toBe("bar/24 24/18");
  });

  it("should throw for invalid move formats", () => {
    expect(() => createBackgammonMove("invalid")).toThrow(
      /Invalid backgammon move format/,
    );
    expect(() => createBackgammonMove("24-18")).toThrow();
    expect(() => createBackgammonMove("24/")).toThrow();
  });

  it("should throw for command injection attempts", () => {
    expect(() => createBackgammonMove("24/18\nquit")).toThrow();
    expect(() => createBackgammonMove("24/18; stop")).toThrow();
  });
});
