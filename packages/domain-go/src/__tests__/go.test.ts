import { describe, it, expect } from "vitest";
import { createGOMove, createGOBoard } from "../index.js";

describe("domain-go", () => {
  describe("createGOMove", () => {
    it("should validate valid moves", () => {
      expect(createGOMove("Q16")).toBe("Q16");
      expect(createGOMove("pass")).toBe("pass");
    });

    it("should throw on invalid moves", () => {
      expect(() => createGOMove("Z99")).toThrow();
      expect(() => createGOMove("Q16\n")).toThrow();
    });
  });

  describe("createGOBoard", () => {
    it("should allow valid strings", () => {
      expect(createGOBoard("board-data")).toBe("board-data");
    });

    it("should throw on injection", () => {
      expect(() => createGOBoard("board\nquit")).toThrow();
    });
  });
});
