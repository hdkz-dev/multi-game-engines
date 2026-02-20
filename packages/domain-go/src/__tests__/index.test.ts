import { describe, it, expect } from "vitest";
import { createGOMove } from "../index.js";

describe("Go Domain", () => {
  it("should validate move format", () => {
    const move = createGOMove("D4");
    expect(move).toBe("d4");
  });

  it("should normalize pass/resign", () => {
    expect(createGOMove("PASS")).toBe("pass");
  });

  it("should throw on invalid coordinates", () => {
    expect(() => createGOMove("I1")).toThrow();
  });
});
