/**
 * Go (GTP) – official rules edge case tests.
 *
 * GTP coordinate system:
 *   - Columns: A-Z excluding I (so A-H, J-Z = 25 columns)
 *   - Rows: 1-25 (19x19 standard board uses 1-19, but GTP allows up to 25)
 *   - Case-insensitive but normalized to lowercase by createGOMove
 *   - Special: "pass" and "resign"
 */
import { describe, it, expect } from "vitest";
import { createGOMove, createGOBoard } from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

// ---------------------------------------------------------------------------
// createGOMove – valid inputs
// ---------------------------------------------------------------------------
describe("createGOMove – valid moves", () => {
  it("normalizes to lowercase: 'D4' → 'd4'", () => {
    expect(createGOMove("D4")).toBe("d4");
  });

  it("accepts all valid columns A-H (skipping I)", () => {
    for (const col of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      expect(createGOMove(`${col}1`)).toBe(`${col}1`);
    }
  });

  it("accepts all valid columns J-Z (25 columns total, I excluded)", () => {
    for (const col of [
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
    ]) {
      expect(createGOMove(`${col}1`)).toBe(`${col}1`);
    }
  });

  it("accepts minimum row 1: 'a1'", () => {
    expect(createGOMove("a1")).toBe("a1");
  });

  it("accepts 19x19 board corner: 't19'", () => {
    expect(createGOMove("t19")).toBe("t19");
  });

  it("accepts maximum allowed row 25: 'z25'", () => {
    expect(createGOMove("z25")).toBe("z25");
  });

  it("accepts row 10-19 (double digits)", () => {
    expect(createGOMove("a10")).toBe("a10");
    expect(createGOMove("a15")).toBe("a15");
    expect(createGOMove("a19")).toBe("a19");
  });

  it("accepts row 20-25", () => {
    expect(createGOMove("a20")).toBe("a20");
    expect(createGOMove("a25")).toBe("a25");
  });

  it("accepts 'pass' (normalized to lowercase)", () => {
    expect(createGOMove("PASS")).toBe("pass");
    expect(createGOMove("pass")).toBe("pass");
  });

  it("accepts 'resign' (normalized to lowercase)", () => {
    expect(createGOMove("RESIGN")).toBe("resign");
    expect(createGOMove("resign")).toBe("resign");
  });

  it("accepts uppercase column that normalizes correctly: 'T19'", () => {
    expect(createGOMove("T19")).toBe("t19");
  });
});

// ---------------------------------------------------------------------------
// createGOMove – invalid inputs
// ---------------------------------------------------------------------------
describe("createGOMove – invalid inputs", () => {
  it("throws VALIDATION_ERROR for column 'I' (excluded in GTP)", () => {
    expect(() => createGOMove("I1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
    expect(() => createGOMove("i5")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws for row 0 ('a0' – rows start at 1)", () => {
    expect(() => createGOMove("a0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws for row 26 ('a26' – maximum is 25)", () => {
    expect(() => createGOMove("a26")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws for row 100", () => {
    expect(() => createGOMove("a100")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createGOMove("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createGOMove("  ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for control character injection '\\n'", () => {
    expect(() => createGOMove("a1\nquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for null byte injection", () => {
    expect(() => createGOMove("a1\0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for special character ';'", () => {
    expect(() => createGOMove("a1;quit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for column only ('a' without row)", () => {
    expect(() => createGOMove("a")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for row only ('1' without column)", () => {
    expect(() => createGOMove("1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});

// ---------------------------------------------------------------------------
// createGOBoard – valid and invalid inputs
// ---------------------------------------------------------------------------
describe("createGOBoard", () => {
  it("accepts simple board string with alphanumeric chars", () => {
    expect(() => createGOBoard("BW.")).not.toThrow();
  });

  it("accepts board string with allowed '-' and '.' and space", () => {
    expect(() => createGOBoard("B W-.BW")).not.toThrow();
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createGOBoard("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createGOBoard("   ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input", () => {
    expect(() => createGOBoard(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for control character '\\n' injection", () => {
    expect(() => createGOBoard("BW\nquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for semicolon ';' in board string", () => {
    expect(() => createGOBoard("BW;quit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for '@' (passes injection check but fails charset regex)", () => {
    expect(() => createGOBoard("BW@bad")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });
});

describe("createGOMove – SECURITY_ERROR for non-alnum after normalize", () => {
  it("throws SECURITY_ERROR for '@' that passes injection check but fails [a-z0-9]+ regex", () => {
    expect(() => createGOMove("a@b")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for '#' in move string", () => {
    expect(() => createGOMove("t#19")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });
});
