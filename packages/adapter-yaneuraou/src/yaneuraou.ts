import { IEngineConfig, IEngine, deepMerge } from "@multi-game-engines/core";
import {
  USIAdapter,
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/adapter-usi";

/**
 * 2026 Zenith Tier: やねうら王専用アダプター。
 * 汎用的な USIAdapter を拡張し、デフォルト設定を提供します。
 */
export class YaneuraouAdapter extends USIAdapter {
  constructor(config?: Partial<IEngineConfig>) {
    const defaultConfig: IEngineConfig = {
      id: "yaneuraou",
      adapter: "usi",
      name: "Yaneuraou",
      version: "7.5.0",
      sources: {
        main: {
          url: "https://example.com/yaneuraou.js",
          // TODO: Replace with real SRI hash before production release
          sri: "sha384-YaneuraouMainScriptHashPlaceholder",
          type: "worker-js",
        },
        wasm: {
          url: "https://example.com/yaneuraou.wasm",
          // TODO: Replace with real SRI hash before production release
          sri: "sha384-YaneuraouWasmBinaryHashPlaceholder",
          type: "wasm",
          mountPath: "yaneuraou.wasm",
        },
        nnue: {
          url: "https://example.com/nnue.bin",
          // TODO: Replace with real SRI hash before production release
          sri: "sha384-YaneuraouNNUEHashPlaceholder",
          type: "eval-data",
          mountPath: "nnue.bin",
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
    yaneuraou: IEngine<
      IShogiSearchOptions,
      IShogiSearchInfo,
      IShogiSearchResult
    >;
  }
}
