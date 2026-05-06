import { tCommon as translate } from "@multi-game-engines/i18n-common";
import {
  Brand,
  EngineError,
  EngineErrorCode,
  ProtocolValidator,
  Move,
  createMove,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  createI18nKey,
} from "@multi-game-engines/core";

// ---------------------------------------------------------------------------
// Branded types
// ---------------------------------------------------------------------------

/** ブリッジのカード (例: "AS", "KH", "2D", "TC") */
export type BridgeCard = Brand<string, "BridgeCard">;

/**
 * ブリッジのビッド (例: "1NT", "2H", "3S", "4D", "5C", "Pass", "Dbl", "Rdbl")
 * コントラクトブリッジのオークション・フェーズ用
 */
export type BridgeBid = Brand<string, "BridgeBid">;

/**
 * ブリッジのカード・プレイ (例: "AS", "KH" — プレイ・フェーズ用)
 * BridgeCard と同一形式だが語義を明確にするため別型
 */
export type BridgePlay = Brand<string, "BridgePlay">;

// ---------------------------------------------------------------------------
// Game state enums / constants
// ---------------------------------------------------------------------------

/** ブリッジのフェーズ */
export type BridgePhase = "auction" | "play" | "done";

/** ブリッジのシート (プレイヤー位置) */
export type BridgeSeat = "N" | "E" | "S" | "W";

/** スーツ (♣クラブ, ♦ダイヤ, ♥ハート, ♠スペード, NT=ノートランプ) */
export type BridgeSuit = "C" | "D" | "H" | "S" | "NT";

/** ビッドのレベル (1-7) */
export type BridgeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ---------------------------------------------------------------------------
// Search Options — エンジンへの入力
// ---------------------------------------------------------------------------

/**
 * コントラクトブリッジの探索オプション。
 *
 * incomplete-information ゲームの特性として、エンジンは
 * 自分の手牌と公開情報（ビッド履歴、プレイ済みカード）のみを受け取ります。
 * パートナーや相手の手牌は推定の対象となります。
 */
export interface IBridgeSearchOptions extends IBaseSearchOptions {
  /** 現在のフェーズ */
  phase: BridgePhase;
  /** 自席 */
  seat: BridgeSeat;
  /** 自分の手牌 (13枚) */
  hand: BridgeCard[];
  /** オークション履歴 (ディーラーの最初のビッドから) */
  auctionHistory?: BridgeBid[] | undefined;
  /** 現在のコントラクト (プレイ・フェーズ) */
  contract?:
    | {
        level: BridgeLevel;
        suit: BridgeSuit;
        declarer: BridgeSeat;
        doubled: boolean;
        redoubled: boolean;
      }
    | undefined;
  /** プレイ済みカードのトリック履歴 */
  tricks?:
    | {
        leader: BridgeSeat;
        cards: BridgeCard[];
      }[]
    | undefined;
  /** ダミー手牌 (デクレアラーとパートナーが可視, プレイ開始後) */
  dummyHand?: BridgeCard[] | undefined;
  /** ディーラー (オークション最初のビッダー) */
  dealer?: BridgeSeat | undefined;
  /** バルネラビリティ */
  vulnerability?: "none" | "NS" | "EW" | "both" | undefined;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Search Info — エンジンからの中間出力
// ---------------------------------------------------------------------------

/**
 * ブリッジエンジンからの中間探索情報。
 */
export interface IBridgeSearchInfo extends IBaseSearchInfo {
  /** ビッド別の期待スコア */
  bidAnalysis?:
    | {
        bid: BridgeBid;
        expectedScore: number;
        freq?: number | undefined;
      }[]
    | undefined;
  /** ダブルダミー解析での取得トリック数 */
  doubleDummyTricks?: number | undefined;
  /** 探索ノード数 */
  nodes?: number | undefined;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Search Result — エンジンからの最終出力
// ---------------------------------------------------------------------------

/**
 * ブリッジエンジンの探索結果。
 *
 * `bestMove` は `IBaseSearchResult` との互換性のため、
 * `bestBid` または `bestPlay` の値が文字列として格納されます。
 */
export interface IBridgeSearchResult extends IBaseSearchResult {
  /** IBaseSearchResult との互換性フィールド (bestBid または bestPlay と同値) */
  bestMove: Move | null;
  /**
   * オークション・フェーズ: 推奨ビッド。
   * プレイ・フェーズ: 推奨プレイカード。
   * null の場合は情報取得失敗。
   */
  bestBid?: BridgeBid | null | undefined;
  bestPlay?: BridgePlay | null | undefined;
  /** 期待スコア */
  expectedScore?: number | undefined;
  /** ダブルダミー解析での取得トリック数 */
  doubleDummyTricks?: number | undefined;
  [key: string]: unknown;
}

/**
 * BridgeBid / BridgePlay を Move として扱うためのキャスト用ヘルパー。
 */
export function bridgeChoiceAsMove(
  choice: BridgeBid | BridgePlay | null | undefined,
): Move | null {
  if (choice == null) return null;
  return createMove(choice);
}

// ---------------------------------------------------------------------------
// Validation regexes
// ---------------------------------------------------------------------------

/**
 * ブリッジのカード表記の正規表現 (例: AS, KH, TD, 2C)。
 * ランク: 2-9, T, J, Q, K, A / スート: S, H, D, C (大文字)
 */
export const BRIDGE_CARD_REGEX = /^([2-9TJQKA][SHDC])$/;

/**
 * ブリッジのビッド表記の正規表現。
 * 形式: <level><suit> | Pass | Dbl | Rdbl
 * (例: 1NT, 2H, 3S, 7C, Pass, Dbl, Rdbl)
 */
export const BRIDGE_BID_REGEX = /^([1-7](C|D|H|S|NT)|Pass|Dbl|Rdbl)$/;

// ---------------------------------------------------------------------------
// Factory / validation functions
// ---------------------------------------------------------------------------

/**
 * 文字列を検証して BridgeCard に変換します。
 */
export function createBridgeCard(card: string): BridgeCard {
  if (typeof card !== "string" || card.trim().length === 0) {
    const i18nKey = createI18nKey("engine.errors.invalidBridgeCard");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(card, "BridgeCard");
  if (!BRIDGE_CARD_REGEX.test(card)) {
    const i18nKey = createI18nKey("engine.errors.invalidBridgeCard");
    const i18nParams = { card };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return card as BridgeCard;
}

/**
 * 文字列を検証して BridgeBid に変換します。
 */
export function createBridgeBid(bid: string): BridgeBid {
  if (typeof bid !== "string" || bid.trim().length === 0) {
    const i18nKey = createI18nKey("engine.errors.invalidBridgeBid");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(bid, "BridgeBid");
  if (!BRIDGE_BID_REGEX.test(bid)) {
    const i18nKey = createI18nKey("engine.errors.invalidBridgeBid");
    const i18nParams = { bid };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return bid as BridgeBid;
}

/**
 * 文字列を検証して BridgePlay に変換します (カードプレイ)。
 * BridgeCard と同じ形式を使用します。
 */
export function createBridgePlay(card: string): BridgePlay {
  if (typeof card !== "string" || card.trim().length === 0) {
    const i18nKey = createI18nKey("engine.errors.invalidBridgePlay");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(card, "BridgePlay");
  if (!BRIDGE_CARD_REGEX.test(card)) {
    const i18nKey = createI18nKey("engine.errors.invalidBridgePlay");
    const i18nParams = { card };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return card as BridgePlay;
}
