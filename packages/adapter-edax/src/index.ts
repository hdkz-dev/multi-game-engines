import { EdaxAdapter } from "./EdaxAdapter.js";
import { EngineFacade } from "@multi-game-engines/core";
import type {
  IEngine,
  IEngineConfig,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult,
} from "@multi-game-engines/domain-reversi";

export { EdaxAdapter };

/**
 * Edax エンジンのインスタンスを生成します。
 */
export function createEdaxEngine(
  config: IEngineConfig = {},
): IEngine<IReversiSearchOptions, IReversiSearchInfo, IReversiSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("edax", config.version) || {};
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    throw new Error(
      '[createEdaxEngine] Engine "edax" requires a "main" source, but it was not found in the registry or config.',
    );
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new EdaxAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
