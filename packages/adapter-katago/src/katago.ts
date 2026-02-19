import { IEngineConfig, deepMerge } from "@multi-game-engines/core";
import { GTPAdapter } from "@multi-game-engines/adapter-gtp";

/**
 * 2026 Zenith Tier: KataGo 専用アダプター。
 * 汎用的な GTPAdapter を拡張し、デフォルト設定を提供します。
 */
export class KataGoAdapter extends GTPAdapter {
  constructor(config?: Partial<IEngineConfig>) {
    const defaultConfig: IEngineConfig = {
      id: "katago",
      adapter: "gtp",
      name: "KataGo",
      version: "1.15.0",
      sources: {
        main: {
          url: "https://example.com/katago.js",
          // TODO: Replace with real SRI hash before production release
          sri: "sha384-KataGoMainScriptHashPlaceholder",
          type: "worker-js",
        },
        wasm: {
          url: "https://example.com/katago.wasm",
          // TODO: Replace with real SRI hash before production release
          sri: "sha384-KataGoWasmBinaryHashPlaceholder",
          type: "wasm",
          mountPath: "katago.wasm",
        },
      },
    };
    const finalConfig = deepMerge(defaultConfig, config);
    super(finalConfig);
  }
}
