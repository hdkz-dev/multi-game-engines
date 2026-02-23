import { describe, it, expect } from "vitest";
import { createGOMove, createGOBoard } from "../index.js";

describe("domain-go", () => {
  describe("createGOMove", () => {
    it("should validate valid moves", () => {
      expect(createGOMove("Q16")).toBe("q16");
      expect(createGOMove("pass")).toBe("pass");
    });

    it("should throw on invalid moves (Validation Error)", () => {
      // Invalid format
      expect(() => createGOMove("Z99")).toThrow(/Invalid GOMove format/);
    });

    it("should throw on injection (Security Error)", () => {
      // Control characters
      expect(() => createGOMove("Q16\n")).toThrow(
        /Potential command injection/,
      );
    });
  });

  describe("createGOBoard", () => {
    it("should allow valid strings", () => {
      expect(createGOBoard("board-data")).toBe("board-data");
    });

    it("should throw on empty input", () => {
      expect(() => createGOBoard("")).toThrow(/Invalid GOBoard/);
    });

    it("should throw on injection (Security Error)", () => {
      expect(() => createGOBoard("board\nquit")).toThrow(
        /Potential command injection/,
      );
    });
  });
});
