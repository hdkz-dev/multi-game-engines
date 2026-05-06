import { describe, it, expect } from "vitest";
import {
  createBridgeCard,
  createBridgeBid,
  createBridgePlay,
  BRIDGE_CARD_REGEX,
  BRIDGE_BID_REGEX,
} from "../index.js";

describe("createBridgeCard", () => {
  it("accepts valid cards", () => {
    expect(createBridgeCard("AS")).toBe("AS");
    expect(createBridgeCard("KH")).toBe("KH");
    expect(createBridgeCard("TD")).toBe("TD");
    expect(createBridgeCard("2C")).toBe("2C");
  });

  it("rejects lowercase suits", () => {
    expect(() => createBridgeCard("Ah")).toThrow();
  });

  it("rejects invalid rank", () => {
    expect(() => createBridgeCard("1S")).toThrow();
    expect(() => createBridgeCard("XS")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => createBridgeCard("")).toThrow();
  });

  it("rejects injection attempt", () => {
    expect(() => createBridgeCard("AS\nPass")).toThrow();
  });
});

describe("createBridgeBid", () => {
  it("accepts level-suit bids", () => {
    expect(createBridgeBid("1NT")).toBe("1NT");
    expect(createBridgeBid("3H")).toBe("3H");
    expect(createBridgeBid("7C")).toBe("7C");
    expect(createBridgeBid("4S")).toBe("4S");
  });

  it("accepts Pass, Dbl, Rdbl", () => {
    expect(createBridgeBid("Pass")).toBe("Pass");
    expect(createBridgeBid("Dbl")).toBe("Dbl");
    expect(createBridgeBid("Rdbl")).toBe("Rdbl");
  });

  it("rejects invalid bids", () => {
    expect(() => createBridgeBid("8NT")).toThrow();
    expect(() => createBridgeBid("0H")).toThrow();
    expect(() => createBridgeBid("pass")).toThrow();
    expect(() => createBridgeBid("")).toThrow();
  });
});

describe("createBridgePlay", () => {
  it("accepts valid card plays", () => {
    expect(createBridgePlay("AS")).toBe("AS");
    expect(createBridgePlay("2D")).toBe("2D");
  });

  it("rejects invalid cards", () => {
    expect(() => createBridgePlay("1S")).toThrow();
    expect(() => createBridgePlay("")).toThrow();
  });
});

describe("BRIDGE_CARD_REGEX", () => {
  it("matches all 52 cards", () => {
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
    const suits = ["S", "H", "D", "C"];
    for (const r of ranks) {
      for (const s of suits) {
        expect(BRIDGE_CARD_REGEX.test(r + s)).toBe(true);
      }
    }
  });
});

describe("BRIDGE_BID_REGEX", () => {
  it("matches 1-7 with all suits", () => {
    const suits = ["C", "D", "H", "S", "NT"];
    for (let level = 1; level <= 7; level++) {
      for (const suit of suits) {
        expect(BRIDGE_BID_REGEX.test(`${level}${suit}`)).toBe(true);
      }
    }
  });

  it("matches special bids", () => {
    expect(BRIDGE_BID_REGEX.test("Pass")).toBe(true);
    expect(BRIDGE_BID_REGEX.test("Dbl")).toBe(true);
    expect(BRIDGE_BID_REGEX.test("Rdbl")).toBe(true);
  });

  it("rejects invalid bids", () => {
    expect(BRIDGE_BID_REGEX.test("8H")).toBe(false);
    expect(BRIDGE_BID_REGEX.test("0C")).toBe(false);
  });
});
