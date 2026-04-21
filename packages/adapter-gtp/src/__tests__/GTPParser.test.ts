import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { GTPParser } from "../GTPParser.js";
import { GOBoard } from "@multi-game-engines/domain-go";

describe("GTPParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const parser = new GTPParser();

  it("should parse info from object correctly", () => {
    const info = parser.parseInfo({ visits: 100, winrate: 0.55 });
    expect(info).not.toBeNull();
    expect(info!.visits).toBe(100);
    expect(info!.winrate).toBe(0.55);
  });

  it("should parse KataGo JSON info correctly", () => {
    const data = {
      visits: 100,
      winrate: 0.55,
      scoreLead: 2.5,
      pv: ["D4", "Q16"],
    };
    const info = parser.parseInfo(data);
    expect(info).not.toBeNull();
    expect(info!.visits).toBe(100);
    expect(info!.winrate).toBe(0.55);
    expect(info!.scoreLead).toBe(2.5);
    expect(info!.pv).toEqual(["d4", "q16"]);
  });

  it("should handle KataGo JSON edge cases (missing winrate, zero winrate, empty PV, invalid moves, and scoreLead fallback)", () => {
    // 1. Missing winrate: defaults to 0
    const info1 = parser.parseInfo({ visits: 50 });
    expect(info1!.winrate).toBe(0);
    expect(info1!.score!.winrate).toBe(0);

    // 2. Winrate is explicitly 0
    const info2 = parser.parseInfo({ visits: 50, winrate: 0 });
    expect(info2!.winrate).toBe(0);

    // 3. Empty PV array
    const info3 = parser.parseInfo({ visits: 50, pv: [] });
    expect(info3!.pv).toBeUndefined();

    // 4. Invalid moves in PV should be filtered out
    const info4 = parser.parseInfo({
      visits: 50,
      pv: ["D4", "invalid", "Q16"],
    });
    expect(info4!.pv).toEqual(["d4", "q16"]);

    // 5. scoreLead is undefined: normalization falls back to winrate
    // ScoreNormalizer.normalize(winrate, "winrate", "go")
    const info5 = parser.parseInfo({ visits: 50, winrate: 0.6 });
    expect(info5!.score!.points).toBeUndefined();
    expect(info5!.score!.normalized).toBeCloseTo(0.2, 8); // (0.6 - 0.5) * 2
  });

  it("should handle non-string PV entries gracefully in KataGo JSON", () => {
    const data = {
      visits: 50,
      pv: ["D4", 123, null, "Q16"],
    };
    const info = parser.parseInfo(data as Record<string, unknown>);
    expect(info!.pv).toEqual(["d4", "q16"]);
  });

  it("should return null for non-info strings", () => {
    expect(parser.parseInfo("random text")).toBeNull();
    expect(parser.parseInfo("")).toBeNull();
  });

  it("should parse result correctly and normalize to lowercase", () => {
    const result = parser.parseResult("= D4");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("d4");
  });

  it("should parse result with ID correctly", () => {
    const result = parser.parseResult("=1 D4");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("d4");
  });

  it("should parse result with different ID correctly", () => {
    const result = parser.parseResult("=42 pass");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("pass");
  });

  it("should validate move coordinates edge cases", () => {
    // Valid cases (up to row 25 in 2026 Zenith Tier)
    expect(parser.parseResult("= T19")?.bestMove).toBe("t19");
    expect(parser.parseResult("= A1")?.bestMove).toBe("a1");
    expect(parser.parseResult("= Z25")?.bestMove).toBe("z25");
    expect(parser.parseResult("= pass")?.bestMove).toBe("pass");

    // Special case: resign is normalized to null (legitimate response but no board move)
    const resignResult = parser.parseResult("= resign");
    expect(resignResult).not.toBeNull();
    expect(resignResult!.bestMove).toBeNull();

    // Invalid cases (Return null in 2026 Zenith Tier parsing logic)
    expect(parser.parseResult("= I1")).toBeNull();
    expect(parser.parseResult("= A0")).toBeNull();
    expect(parser.parseResult("= A26")).toBeNull();
    expect(parser.parseResult("= @1")).toBeNull();
  });

  it("should throw error for injection in board data", () => {
    expect(() =>
      parser.createSearchCommand({
        board: "A1\nquit" as unknown as GOBoard,
        color: "black",
      }),
    ).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
  });

  it("should create valid option command", () => {
    expect(parser.createOptionCommand("analysis_threads", 4)).toBe(
      "set_option analysis_threads 4",
    );
  });

  it("should throw error for injection in option name or value", () => {
    expect(() =>
      parser.createOptionCommand("analysis_threads\nquit", 4),
    ).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
    expect(() =>
      parser.createOptionCommand("analysis_threads", "4\nquit"),
    ).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
  });

  describe("createOptionCommand() type validation", () => {
    it("should throw TypeError when value is null", () => {
      expect(() =>
        parser.createOptionCommand("opt", null as unknown as string),
      ).toThrow(TypeError);
    });

    it("should throw TypeError when value is undefined", () => {
      expect(() =>
        parser.createOptionCommand("opt", undefined as unknown as string),
      ).toThrow(TypeError);
    });

    it("should throw TypeError when value is an object", () => {
      expect(() =>
        parser.createOptionCommand("opt", {} as unknown as string),
      ).toThrow(TypeError);
    });

    it("should accept boolean value", () => {
      expect(parser.createOptionCommand("analysis_ponder", true)).toBe(
        "set_option analysis_ponder true",
      );
    });
  });

  describe("translateError() edge cases", () => {
    it("should return null when message does not start with '?'", () => {
      expect(parser.translateError("ERROR invalid move")).toBeNull();
    });

    it("should return null when message starts with '?' but has no 'invalid'", () => {
      expect(parser.translateError("? unknown command")).toBeNull();
    });

    it("should return i18n key when message starts with '?' and contains 'invalid'", () => {
      expect(parser.translateError("? invalid move")).toBe(
        "adapters.gtp.errors.invalidResponse",
      );
    });

    it("should be case-insensitive for 'invalid' check", () => {
      expect(parser.translateError("? INVALID COORDINATE")).toBe(
        "adapters.gtp.errors.invalidResponse",
      );
    });
  });

  describe("createSearchCommand() kataInterval edge cases", () => {
    it("should include kata-analyze when kataInterval is 0 (finite)", () => {
      const cmds = parser.createSearchCommand({
        kataInterval: 0,
        color: "black",
      });
      expect(cmds).toContain("kata-analyze interval 0");
    });

    it("should exclude kata-analyze when kataInterval is Infinity", () => {
      const cmds = parser.createSearchCommand({
        kataInterval: Infinity,
        color: "black",
      });
      expect(cmds.some((c) => c.startsWith("kata-analyze"))).toBe(false);
    });

    it("should exclude kata-analyze when kataInterval is NaN", () => {
      const cmds = parser.createSearchCommand({
        kataInterval: NaN,
        color: "black",
      });
      expect(cmds.some((c) => c.startsWith("kata-analyze"))).toBe(false);
    });

    it("should include kata-analyze when kataInterval is a numeric string '5'", () => {
      const cmds = parser.createSearchCommand({
        kataInterval: "5" as unknown as number,
        color: "black",
      });
      expect(cmds).toContain("kata-analyze interval 5");
    });

    it("should not include kata-analyze when kataInterval is null", () => {
      const cmds = parser.createSearchCommand({
        kataInterval: null as unknown as number,
        color: "black",
      });
      expect(cmds.some((c) => c.startsWith("kata-analyze"))).toBe(false);
    });

    it("should include loadsgf command when board is provided", () => {
      const board = "A1 B2" as unknown as GOBoard;
      const cmds = parser.createSearchCommand({ board, color: "black" });
      expect(cmds).toContain("loadsgf A1 B2");
    });
  });

  describe("createStopCommand", () => {
    it("should return 'stop'", () => {
      expect(parser.createStopCommand()).toBe("stop");
    });
  });
});
