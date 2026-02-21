import { ref, readonly, shallowRef } from "vue";
import { EngineBridge } from "@multi-game-engines/core";
import { createStockfishEngine } from "@multi-game-engines/adapter-stockfish";
import { createYaneuraouEngine } from "@multi-game-engines/adapter-yaneuraou";
import { createUCIEngine } from "@multi-game-engines/adapter-uci";
import { createUSIEngine } from "@multi-game-engines/adapter-usi";
import { createGTPEngine } from "@multi-game-engines/adapter-gtp";
import { createEdaxEngine } from "@multi-game-engines/adapter-edax";
import { createMortalEngine } from "@multi-game-engines/adapter-mortal";
import { createGNUBGEngine } from "@multi-game-engines/adapter-gnubg";
import { createKingsRowEngine } from "@multi-game-engines/adapter-kingsrow";

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

        // Register generic adapter factories
        b.registerAdapterFactory("uci", createUCIEngine);
        b.registerAdapterFactory("usi", createUSIEngine);
        b.registerAdapterFactory("gtp", createGTPEngine);
        b.registerAdapterFactory("edax", createEdaxEngine);
        b.registerAdapterFactory("mortal", createMortalEngine);
        b.registerAdapterFactory("gnubg", createGNUBGEngine);
        b.registerAdapterFactory("kingsrow", createKingsRowEngine);

        // Register specific named engine factories
        b.registerAdapterFactory("stockfish", createStockfishEngine);
        b.registerAdapterFactory("yaneuraou", createYaneuraouEngine);

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
  getBridge();

  return {
    getBridge,
    bridge: readonly(bridge),
    isReady: readonly(isReady),
    error: readonly(error),
  };
}
