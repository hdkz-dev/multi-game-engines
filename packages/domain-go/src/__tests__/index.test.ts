import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createGOMove, createGOBoard } from "../index.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

beforeAll(() => {
  vi.spyOn(performance, "now").mockReturnValue(0);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("Go Domain", () => {
  it("should validate move format", () => {
    const move = createGOMove("D4");
    expect(move).toBe("d4");
  });

  it("should normalize pass/resign", () => {
    expect(createGOMove("PASS")).toBe("pass");
    expect(createGOMove("RESIGN")).toBe("resign");
    expect(createGOMove("resign")).toBe("resign");
  });

  it("should throw VALIDATION_ERROR on invalid coordinates", () => {
    let err: unknown;
    try {
      createGOMove("I1");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EngineError);
    if (err instanceof EngineError) {
      expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
    }
  });

  it("should throw VALIDATION_ERROR on illegal characters in board", () => {
    let err: unknown;
    try {
      createGOBoard("A1;B2");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EngineError);
    if (err instanceof EngineError) {
      expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
    }
  });
});
