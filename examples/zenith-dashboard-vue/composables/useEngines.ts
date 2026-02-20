import { ref, readonly } from "vue";
import { EngineBridge, truncateLog } from "@multi-game-engines/core";
import { StockfishAdapter } from "@multi-game-engines/adapter-stockfish";
import { YaneuraouAdapter } from "@multi-game-engines/adapter-yaneuraou";
import { createUCIEngine } from "@multi-game-engines/adapter-uci";
import { createUSIEngine } from "@multi-game-engines/adapter-usi";
import { createGTPEngine } from "@multi-game-engines/adapter-gtp";
import { createEdaxEngine } from "@multi-game-engines/adapter-edax";
import { createMortalEngine } from "@multi-game-engines/adapter-mortal";
import { createGNUBGEngine } from "@multi-game-engines/adapter-gnubg";
import { createKingsRowEngine } from "@multi-game-engines/adapter-kingsrow";

let bridge: EngineBridge | null = null;
const isReady = ref(false);
const error = ref<string | null>(null);

/**
 * Returns a singleton EngineBridge instance.
 */
export function getBridge(): EngineBridge | null {
  if (typeof window === "undefined") return null;

  if (!bridge) {
    bridge = new EngineBridge();

    // 2026 Zenith Tier: 汎用アダプターファクトリの登録
    bridge.registerAdapterFactory("uci", createUCIEngine);
    bridge.registerAdapterFactory("usi", createUSIEngine);
    bridge.registerAdapterFactory("gtp", createGTPEngine);
    bridge.registerAdapterFactory("edax", createEdaxEngine);
    bridge.registerAdapterFactory("mortal", createMortalEngine);
    bridge.registerAdapterFactory("gnubg", createGNUBGEngine);
    bridge.registerAdapterFactory("kingsrow", createKingsRowEngine);

    // 2026 Zenith Tier: デフォルトアダプターの登録
    const adapters = [
      { name: "Stockfish", adapter: new StockfishAdapter() },
      { name: "Yaneuraou", adapter: new YaneuraouAdapter() },
    ];

    let successCount = 0;
    const errors: string[] = [];

    Promise.all(
      adapters.map(({ name, adapter }) =>
        bridge!
          .registerAdapter(adapter)
          .then(() => {
            successCount++;
          })
          .catch((e) => {
            const msg = `Failed to register ${name} adapter: ${truncateLog(String(e))}`;
            console.warn(`[Dashboard] ${msg}`);
            errors.push(msg);
          }),
      ),
    ).then(() => {
      if (successCount > 0) {
        isReady.value = true;
      }
      if (errors.length > 0) {
        error.value = errors.join(" | ");
      }
    });
  }
  return bridge;
}

/**
 * Vue composable to access the EngineBridge and its initialization state.
 */
export function useEngines() {
  const b = getBridge();
  return {
    bridge: b,
    isReady: readonly(isReady),
    error: readonly(error),
  };
}
