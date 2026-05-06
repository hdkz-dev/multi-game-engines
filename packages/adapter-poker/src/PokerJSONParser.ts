import {
  IProtocolParser,
  MiddlewareCommand,
  ProtocolValidator,
  I18nKey,
  createI18nKey,
} from "@multi-game-engines/core";

import {
  createPokerAction,
  parsePokerAction,
  pokerActionAsMove,
  type IPokerSearchOptions,
  type IPokerSearchInfo,
  type IPokerSearchResult,
  type PokerAction,
} from "@multi-game-engines/domain-poker";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * ポーカーエンジンからの JSON レスポンスをパースします。
 *
 * 想定プロトコル:
 * - アクション応答: `{"type":"result","action":"raise:150","equity":0.62}`
 * - 中間情報: `{"type":"info","nodes":12345,"equity":0.55}`
 * - 準備完了: `{"ready":true}`
 */
export class PokerJSONParser implements IProtocolParser<
  IPokerSearchOptions,
  IPokerSearchInfo,
  IPokerSearchResult
> {
  private isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
  }

  parseInfo(data: string | Record<string, unknown>): IPokerSearchInfo | null {
    try {
      const parsed: unknown =
        typeof data === "string" ? JSON.parse(data) : data;
      if (!this.isObject(parsed) || parsed["type"] !== "info") return null;

      return {
        depth: typeof parsed["depth"] === "number" ? parsed["depth"] : 0,
        nodes:
          typeof parsed["nodes"] === "number" ? parsed["nodes"] : undefined,
        equity:
          typeof parsed["equity"] === "number" ? parsed["equity"] : undefined,
      };
    } catch {
      return null;
    }
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IPokerSearchResult | null {
    try {
      const parsed: unknown =
        typeof data === "string" ? JSON.parse(data) : data;
      if (!this.isObject(parsed) || parsed["type"] !== "result") return null;

      const actionStr = parsed["action"];
      if (typeof actionStr !== "string") return null;

      let bestAction: PokerAction | null;
      try {
        bestAction = createPokerAction(actionStr);
      } catch {
        bestAction = null;
      }

      const { type: actionType, raiseAmount } = bestAction
        ? parsePokerAction(bestAction)
        : { type: undefined as never, raiseAmount: undefined };

      return {
        bestMove: pokerActionAsMove(bestAction),
        bestAction,
        actionType: bestAction ? actionType : undefined,
        raiseAmount,
        equity:
          typeof parsed["equity"] === "number" ? parsed["equity"] : undefined,
      };
    } catch {
      return null;
    }
  }

  createSearchCommand(options: IPokerSearchOptions): MiddlewareCommand {
    ProtocolValidator.assertNoInjection(
      JSON.stringify(options.holeCards),
      "holeCards",
      true,
    );
    return JSON.stringify({
      type: "search",
      holeCards: options.holeCards,
      communityCards: options.communityCards,
      street: options.street,
      pot: options.pot,
      myStack: options.myStack,
      villainStacks: options.villainStacks,
      toCall: options.toCall,
      position: options.position,
      actionHistory: options.actionHistory,
      depth: options.depth,
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
