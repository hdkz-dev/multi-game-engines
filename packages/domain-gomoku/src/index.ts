import { tCommon as translate } from "@multi-game-engines/i18n-common";
import { Brand,
  EngineError,
  EngineErrorCode,
  Move,
  createMove,
  createPositionString,
  ProtocolValidator,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  createI18nKey } from "@multi-game-engines/core";

/**
 * 五目並べの指し手（例: "h8" 等の座標）。
 */
export type GomokuMove = Brand<Move, "GomokuMove">;

/**
 * 五目並べの局面表記（独自形式または GTP ライク）。
 */
export type GomokuPositionString = Brand<string, "GomokuPositionString">;

/**
 * 五目並べ専用の探索オプション。
 */
export interface IGomokuSearchOptions extends IBaseSearchOptions {
  position?: GomokuPositionString | undefined;
  /** 連の数 (通常は 5 だが、ルールのバリエーション用) */
  winLength?: number | undefined;
}

/**
 * 五目並べ専用の探索情報。
 */
export interface IGomokuSearchInfo extends IBaseSearchInfo {
  /** VCF (Victory by Continuous Four) のステップ数等 */
  vcfSteps?: number | undefined;
  /** VCT (Victory by Continuous Three) のステップ数等 */
  vctSteps?: number | undefined;
}

/**
 * 五目並べ専用の探索結果。
 */
export interface IGomokuSearchResult extends IBaseSearchResult {
  bestMove: GomokuMove | null;
  ponder?: GomokuMove | undefined;
}

/**
 * 文字列を検証して GomokuMove に変換します。
 * (2026 Zenith Tier: Refuse by Exception)
 *
 * @param move 検証する文字列 (例: "h8", "resign")
 */
export function createGomokuMove(move: string): GomokuMove {
  if (
    typeof move !== "string" ||
    (!/^[a-zA-Z][1-9][0-9]?$/.test(move) &&
      move !== "resign" &&
      move !== "pass")
  ) {
    const i18nKey = createI18nKey("engine.errors.invalidMoveFormat");
    const i18nParams = { move };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return createMove<"GomokuMove">(move);
}

/**
 * 文字列を検証して GomokuPositionString に変換します。
 */
export function createGomokuPositionString(pos: string): GomokuPositionString {
  if (typeof pos !== "string" || pos.trim() === "") {
    const i18nKey = createI18nKey("engine.errors.invalidPositionString");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(pos, "Gomoku Position");
  return createPositionString<"GomokuPositionString">(pos);
}
