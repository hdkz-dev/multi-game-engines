import { describe, it, expect } from "vitest";
import {
  createPokerCard,
  createPokerAction,
  parsePokerAction,
  POKER_CARD_REGEX,
  POKER_ACTION_REGEX,
} from "../index.js";

describe("createPokerCard", () => {
  it("accepts valid cards", () => {
    expect(createPokerCard("Ah")).toBe("Ah");
    expect(createPokerCard("2c")).toBe("2c");
    expect(createPokerCard("Ts")).toBe("Ts");
    expect(createPokerCard("Kd")).toBe("Kd");
  });

  it("rejects invalid rank/suit", () => {
    expect(() => createPokerCard("Xh")).toThrow();
    expect(() => createPokerCard("Ax")).toThrow();
    expect(() => createPokerCard("1h")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => createPokerCard("")).toThrow();
  });

  it("rejects injection attempts", () => {
    expect(() => createPokerCard("Ah\nraise:9999")).toThrow();
  });
});

describe("createPokerAction", () => {
  it("accepts fold, check, call, allin", () => {
    expect(createPokerAction("fold")).toBe("fold");
    expect(createPokerAction("check")).toBe("check");
    expect(createPokerAction("call")).toBe("call");
    expect(createPokerAction("allin")).toBe("allin");
  });

  it("accepts raise with positive amount", () => {
    expect(createPokerAction("raise:100")).toBe("raise:100");
    expect(createPokerAction("raise:1")).toBe("raise:1");
  });

  it("rejects raise with zero or negative amount", () => {
    expect(() => createPokerAction("raise:0")).toThrow();
    expect(() => createPokerAction("raise:-10")).toThrow();
  });

  it("rejects unknown action", () => {
    expect(() => createPokerAction("bet:100")).toThrow();
    expect(() => createPokerAction("")).toThrow();
  });
});

describe("parsePokerAction", () => {
  it("parses fold correctly", () => {
    expect(
      parsePokerAction("fold" as ReturnType<typeof createPokerAction>),
    ).toEqual({
      type: "fold",
    });
  });

  it("parses raise with amount", () => {
    const result = parsePokerAction(
      "raise:250" as ReturnType<typeof createPokerAction>,
    );
    expect(result.type).toBe("raise");
    expect(result.raiseAmount).toBe(250);
  });
});

describe("POKER_CARD_REGEX", () => {
  it("matches all valid cards", () => {
    const ranks = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "T",
      "J",
      "Q",
      "K",
      "A",
    ];
    const suits = ["h", "d", "c", "s"];
    for (const r of ranks) {
      for (const s of suits) {
        expect(POKER_CARD_REGEX.test(r + s)).toBe(true);
      }
    }
  });
});

describe("POKER_ACTION_REGEX", () => {
  it("matches valid actions", () => {
    expect(POKER_ACTION_REGEX.test("fold")).toBe(true);
    expect(POKER_ACTION_REGEX.test("raise:500")).toBe(true);
  });

  it("rejects invalid actions", () => {
    expect(POKER_ACTION_REGEX.test("raise:0")).toBe(false);
    expect(POKER_ACTION_REGEX.test("bet")).toBe(false);
  });
});
