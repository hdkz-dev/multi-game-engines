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

/** ポーカーのカード (例: "Ah", "Kd", "2c", "Ts") */
export type PokerCard = Brand<string, "PokerCard">;

/** ポーカーのアクション (例: "fold", "call", "raise:150") */
export type PokerAction = Brand<string, "PokerAction">;

// ---------------------------------------------------------------------------
// Game state enums / constants
// ---------------------------------------------------------------------------

/** ベッティングラウンド */
export type PokerStreet = "preflop" | "flop" | "turn" | "river";

/** プレイヤーポジション (BTN = button, SB, BB, UTG など) */
export type PokerPosition =
  | "BTN"
  | "SB"
  | "BB"
  | "UTG"
  | "UTG1"
  | "UTG2"
  | "HJ"
  | "CO";

/** アクションの種別 */
export type PokerActionType = "fold" | "check" | "call" | "raise" | "allin";

// ---------------------------------------------------------------------------
// Search Options — エンジンへの入力
// ---------------------------------------------------------------------------

/**
 * テキサスホールデムポーカーの探索オプション。
 *
 * incomplete-information ゲームの特性として、エンジンは
 * 自分のホールカードと公開済みコミュニティカードのみを受け取り、
 * 相手のホールカードは知りません。
 */
export interface IPokerSearchOptions extends IBaseSearchOptions {
  /** 自分のホールカード (2枚固定) */
  holeCards: [PokerCard, PokerCard];
  /** コミュニティカード (flop: 3枚, turn: 4枚, river: 5枚) */
  communityCards: PokerCard[];
  /** 現在のベッティングラウンド */
  street: PokerStreet;
  /** ポット総額 (チップ単位) */
  pot: number;
  /** 自分のスタック (チップ単位) */
  myStack: number;
  /** 対戦相手のスタック (チップ単位, 複数対応) */
  villainStacks: number[];
  /** 現在のコールに必要な額 */
  toCall: number;
  /** 自分のポジション */
  position?: PokerPosition | undefined;
  /** アクション履歴 (直近のストリートの順に) */
  actionHistory?: string[] | undefined;
  /** GTO ソルバー探索深さ */
  depth?: number | undefined;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Search Info — エンジンからの中間出力
// ---------------------------------------------------------------------------

/**
 * ポーカーエンジンからの中間探索情報。
 */
export interface IPokerSearchInfo extends IBaseSearchInfo {
  /** アクション別の期待値 (EV) */
  actionEV?:
    | {
        action: PokerActionType;
        ev: number;
        freq?: number | undefined;
      }[]
    | undefined;
  /** エクイティ (0.0 ~ 1.0) */
  equity?: number | undefined;
  /** ノード数 */
  nodes?: number | undefined;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Search Result — エンジンからの最終出力
// ---------------------------------------------------------------------------

/**
 * ポーカーエンジンの探索結果。
 *
 * `bestMove` は `IBaseSearchResult` との互換性のため、
 * `bestAction` と同一の値 (または null) が設定されます。
 */
export interface IPokerSearchResult extends IBaseSearchResult {
  /** IBaseSearchResult との互換性フィールド (bestAction と同値) */
  bestMove: Move | null;
  /** 推奨アクション。null の場合は情報取得失敗 */
  bestAction: PokerAction | null;
  /** アクション種別 */
  actionType?: PokerActionType | undefined;
  /** レイズ額 (raise/allin の場合) */
  raiseAmount?: number | undefined;
  /** エクイティ推定値 (0.0 ~ 1.0) */
  equity?: number | undefined;
  [key: string]: unknown;
}

/**
 * PokerAction を Move として扱うためのキャスト用ヘルパー。
 * IBaseSearchResult.bestMove との互換性維持に使用します。
 */
export function pokerActionAsMove(action: PokerAction | null): Move | null {
  if (action === null) return null;
  return createMove(action);
}

// ---------------------------------------------------------------------------
// Validation regexes
// ---------------------------------------------------------------------------

/**
 * ポーカーカード表記の正規表現 (例: Ah, Kd, Tc, 2s)。
 * ランク: 2-9, T, J, Q, K, A / スート: h, d, c, s
 */
export const POKER_CARD_REGEX = /^([2-9TJQKA][hdcs])$/;

/**
 * ポーカーアクション表記の正規表現。
 * 形式: fold | check | call | allin | raise:<正の整数>
 */
export const POKER_ACTION_REGEX = /^(fold|check|call|allin|raise:[1-9][0-9]*)$/;

// ---------------------------------------------------------------------------
// Factory / validation functions
// ---------------------------------------------------------------------------

/**
 * 文字列を検証して PokerCard に変換します。
 */
export function createPokerCard(card: string): PokerCard {
  if (typeof card !== "string" || card.trim().length === 0) {
    const i18nKey = createI18nKey("engine.errors.invalidPokerCard");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(card, "PokerCard");
  if (!POKER_CARD_REGEX.test(card)) {
    const i18nKey = createI18nKey("engine.errors.invalidPokerCard");
    const i18nParams = { card };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return card as PokerCard;
}

/**
 * 文字列を検証して PokerAction に変換します。
 */
export function createPokerAction(action: string): PokerAction {
  if (typeof action !== "string" || action.trim().length === 0) {
    const i18nKey = createI18nKey("engine.errors.invalidPokerAction");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(action, "PokerAction");
  if (!POKER_ACTION_REGEX.test(action)) {
    const i18nKey = createI18nKey("engine.errors.invalidPokerAction");
    const i18nParams = { action };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return action as PokerAction;
}

/**
 * PokerAction からアクション種別とレイズ額を分解します。
 */
export function parsePokerAction(action: PokerAction): {
  type: PokerActionType;
  raiseAmount?: number;
} {
  if (action.startsWith("raise:")) {
    return {
      type: "raise",
      raiseAmount: parseInt(action.slice(6), 10),
    };
  }
  return { type: action as PokerActionType };
}
