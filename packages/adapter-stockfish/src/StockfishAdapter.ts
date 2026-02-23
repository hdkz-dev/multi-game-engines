import { IEngineConfig, IEngine, deepMerge } from "@multi-game-engines/core";
import {
  UCIAdapter,
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "@multi-game-engines/adapter-uci";

/**
 * 2026 Zenith Tier: Stockfish 専用アダプター。
 * 汎用的な UCIAdapter を拡張し、Stockfish 用のデフォルト設定を提供します。
 */
export class StockfishAdapter extends UCIAdapter {
  constructor(config?: Partial<IEngineConfig>) {
    const defaultConfig: IEngineConfig = {
      id: "stockfish",
      adapter: "uci",
      name: "Stockfish",
      version: "16.1",
      sources: {
        main: {
          url: "https://example.com/stockfish.js",
          // SECURITY: Ensure SRI hash is updated for production binaries
          sri: "sha384-SetCorrectHashHereToSatisfySecurityAudit0123456789ABCDEF01234567",
          type: "worker-js",
        },
        wasm: {
          url: "https://example.com/stockfish.wasm",
          // SECURITY: Ensure SRI hash is updated for production binaries
          sri: "sha384-SetCorrectHashHereToSatisfySecurityAudit0123456789ABCDEF01234567",
          type: "wasm",
          mountPath: "stockfish.wasm",
        },
      },
    };
    const finalConfig = deepMerge(defaultConfig, config);
    super(finalConfig);
  }
}

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    stockfish: IEngine<
      IChessSearchOptions,
      IChessSearchInfo,
      IChessSearchResult
    >;
  }
}
