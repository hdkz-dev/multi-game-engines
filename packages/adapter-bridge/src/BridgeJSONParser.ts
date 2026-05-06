import {
  IProtocolParser,
  MiddlewareCommand,
  ProtocolValidator,
  I18nKey,
  createI18nKey,
} from "@multi-game-engines/core";

import {
  createBridgeBid,
  createBridgePlay,
  bridgeChoiceAsMove,
  type IBridgeSearchOptions,
  type IBridgeSearchInfo,
  type IBridgeSearchResult,
  type BridgeBid,
  type BridgePlay,
} from "@multi-game-engines/domain-bridge";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * ブリッジエンジンからの JSON レスポンスをパースします。
 *
 * 想定プロトコル:
 * - オークション応答: `{"type":"result","bid":"3NT","expectedScore":400}`
 * - カードプレイ応答: `{"type":"result","play":"AS","doubleDummyTricks":10}`
 * - 中間情報: `{"type":"info","nodes":5000,"doubleDummyTricks":9}`
 * - 準備完了: `{"ready":true}`
 */
export class BridgeJSONParser implements IProtocolParser<
  IBridgeSearchOptions,
  IBridgeSearchInfo,
  IBridgeSearchResult
> {
  private isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
  }

  parseInfo(data: string | Record<string, unknown>): IBridgeSearchInfo | null {
    try {
      const parsed: unknown =
        typeof data === "string" ? JSON.parse(data) : data;
      if (!this.isObject(parsed) || parsed["type"] !== "info") return null;

      return {
        depth: typeof parsed["depth"] === "number" ? parsed["depth"] : 0,
        nodes:
          typeof parsed["nodes"] === "number" ? parsed["nodes"] : undefined,
        doubleDummyTricks:
          typeof parsed["doubleDummyTricks"] === "number"
            ? parsed["doubleDummyTricks"]
            : undefined,
      };
    } catch {
      return null;
    }
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IBridgeSearchResult | null {
    try {
      const parsed: unknown =
        typeof data === "string" ? JSON.parse(data) : data;
      if (!this.isObject(parsed) || parsed["type"] !== "result") return null;

      // オークション・フェーズ: bid フィールド
      if (typeof parsed["bid"] === "string") {
        let bestBid: BridgeBid | null;
        try {
          bestBid = createBridgeBid(parsed["bid"]);
        } catch {
          bestBid = null;
        }
        return {
          bestMove: bridgeChoiceAsMove(bestBid),
          bestBid,
          expectedScore:
            typeof parsed["expectedScore"] === "number"
              ? parsed["expectedScore"]
              : undefined,
        };
      }

      // プレイ・フェーズ: play フィールド
      if (typeof parsed["play"] === "string") {
        let bestPlay: BridgePlay | null;
        try {
          bestPlay = createBridgePlay(parsed["play"]);
        } catch {
          bestPlay = null;
        }
        return {
          bestMove: bridgeChoiceAsMove(bestPlay),
          bestPlay,
          doubleDummyTricks:
            typeof parsed["doubleDummyTricks"] === "number"
              ? parsed["doubleDummyTricks"]
              : undefined,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  createSearchCommand(options: IBridgeSearchOptions): MiddlewareCommand {
    ProtocolValidator.assertNoInjection(
      JSON.stringify(options.hand),
      "bridge hand",
      true,
    );
    return JSON.stringify({
      type: "search",
      phase: options.phase,
      seat: options.seat,
      hand: options.hand,
      auctionHistory: options.auctionHistory,
      contract: options.contract,
      tricks: options.tricks,
      dummyHand: options.dummyHand,
      dealer: options.dealer,
      vulnerability: options.vulnerability,
    });
  }

  createStopCommand(): MiddlewareCommand {
    return JSON.stringify({ type: "stop" });
  }

  createOptionCommand(name: string, value: unknown): MiddlewareCommand {
    const sName = String(name);
    const sValue = String(value);
    ProtocolValidator.assertNoInjection(sName, "option name", true);
    ProtocolValidator.assertNoInjection(sValue, "option value", true);
    return JSON.stringify({ type: "option", name: sName, value: sValue });
  }

  translateError(message: string): I18nKey | null {
    if (message.toLowerCase().includes("timeout")) {
      return createI18nKey("engine.errors.timeout");
    }
    return null;
  }
}
