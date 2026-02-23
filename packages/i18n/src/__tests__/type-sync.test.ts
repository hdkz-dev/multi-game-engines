import { describe, it, expect } from "vitest";
import { locales } from "../index.js";
import type { ValidI18nKey } from "@multi-game-engines/core";

// Flatten keys helper
function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      keys = keys.concat(flattenKeys(value as Record<string, unknown>, newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

describe("i18n Type Synchronization", () => {
  // Core パッケージで定義された重要なエラーキー。
  // ValidI18nKey 型で制約することで、Core 側の型定義変更をコンパイル時に検知できる。
  const criticalKeys: ValidI18nKey[] = [
    "engine.errors.initializationFailed",
    "engine.errors.workerError",
    "engine.errors.timeout",
    "engine.errors.disposed",
    "engine.errors.sriMismatch",
    "engine.errors.invalidFEN",
    "engine.errors.invalidSFEN",
    "engine.errors.invalidMoveFormat",
    "engine.errors.injectionDetected",
    "engine.errors.bridgeDisposed",
    "engine.errors.illegalCharacters",
    "engine.errors.invalidFENStructure",
    "engine.errors.invalidFENTurn",
    "engine.errors.invalidFENEnPassant",
    "engine.errors.invalidFENCastling",
    "engine.errors.invalidFENHalfmove",
    "engine.errors.invalidFENFullmove",
    "engine.errors.invalidSFENStructure",
    "engine.errors.invalidSFENTurn",
    "engine.errors.invalidSFENHand",
    "engine.errors.invalidSFENMoveCounter",
    "engine.errors.invalidFenRanks",
    "engine.errors.invalidFenRow",
    "engine.errors.invalidFenChar",
    "engine.errors.invalidFenRankWidth",
    "engine.errors.invalidSfenRanks",
    "engine.errors.invalidSfenPiece",
    "engine.errors.invalidSfenChar",
    "engine.errors.invalidSfenRankWidth",
    "engine.errors.invalidShogiMove",
    "engine.errors.invalidMahjongMove",
    "engine.errors.notReady",
    "adapters.uci.errors.missing_fen",
    "adapters.usi.errors.missing_fen",
    "adapters.gtp.errors.invalid_response",
    "adapters.ensemble.errors.no_results",
  ];

  const enKeys = new Set(flattenKeys(locales.en));
  const jaKeys = new Set(flattenKeys(locales.ja));

  it("should have all critical error keys defined in en.json", () => {
    const missing: string[] = [];
    for (const key of criticalKeys) {
      if (!enKeys.has(key)) {
        missing.push(key);
      }
    }
    expect(missing).toEqual([]);
  });

  it("should have all critical error keys defined in ja.json", () => {
    const missing: string[] = [];
    for (const key of criticalKeys) {
      if (!jaKeys.has(key)) {
        missing.push(key);
      }
    }
    expect(missing).toEqual([]);
  });
});
