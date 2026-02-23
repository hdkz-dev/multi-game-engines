import { ref, readonly, shallowRef } from "vue";
import { EngineBridge } from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import { StockfishAdapter } from "@multi-game-engines/adapter-stockfish";
import { YaneuraouAdapter } from "@multi-game-engines/adapter-yaneuraou";
import { UCIAdapter } from "@multi-game-engines/adapter-uci";
import { USIAdapter } from "@multi-game-engines/adapter-usi";
import { GTPAdapter } from "@multi-game-engines/adapter-gtp";
import { EdaxAdapter } from "@multi-game-engines/adapter-edax";
import { MortalAdapter } from "@multi-game-engines/adapter-mortal";
import { GNUBGAdapter } from "@multi-game-engines/adapter-gnubg";
import { KingsRowAdapter } from "@multi-game-engines/adapter-kingsrow";

// Use shallowRef for non-POJO class instances to avoid overhead
const bridge = shallowRef<EngineBridge | null>(null);
let initPromise: Promise<EngineBridge | null> | null = null;
const isReady = ref(false);
const error = ref<string | null>(null);

/**
 * Initializes and returns a singleton EngineBridge instance.
 */
export async function getBridge(): Promise<EngineBridge | null> {
  if (typeof window === "undefined") return null;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!bridge.value) {
        const b = new EngineBridge();

        // 2026 Best Practice: セントラルレジストリを登録
        b.addRegistry(OfficialRegistry);

        // Register generic adapter factories
        b.registerAdapterFactory("uci", (config) => new UCIAdapter(config));
        b.registerAdapterFactory("usi", (config) => new USIAdapter(config));
        b.registerAdapterFactory("gtp", (config) => new GTPAdapter(config));
        b.registerAdapterFactory("edax", (config) => new EdaxAdapter(config));
        b.registerAdapterFactory(
          "mortal",
          (config) => new MortalAdapter(config),
        );
        b.registerAdapterFactory("gnubg", (config) => new GNUBGAdapter(config));
        b.registerAdapterFactory(
          "kingsrow",
          (config) => new KingsRowAdapter(config),
        );

        // Register specific named engine factories
        b.registerAdapterFactory(
          "stockfish",
          (config) => new StockfishAdapter(config),
        );
        b.registerAdapterFactory(
          "yaneuraou",
          (config) => new YaneuraouAdapter(config),
        );

        bridge.value = b;
        isReady.value = true;
      }
      return bridge.value;
    } catch (e) {
      console.error("Failed to initialize engine bridge:", e);
      error.value = e instanceof Error ? e.message : String(e);
      return null;
    }
  })();

  return initPromise;
}

/**
 * Vue composable to access the EngineBridge and its initialization state.
 */
export function useEngines() {
  // Trigger initialization
  void getBridge();

  return {
    getBridge,
    bridge: readonly(bridge),
    isReady: readonly(isReady),
    error: readonly(error),
  };
}
