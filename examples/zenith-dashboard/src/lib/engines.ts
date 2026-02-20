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

let bridge: EngineBridge | null = null;
let initPromise: Promise<EngineBridge | null> | null = null;

export async function getBridge(): Promise<EngineBridge | null> {
  if (typeof window === "undefined") return null;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!bridge) {
      bridge = new EngineBridge();

      // Register generic adapter factories
      // This allows dynamic instantiation via getEngine({ adapter: "uci", ... })
      bridge.registerAdapterFactory("uci", createUCIEngine);
      bridge.registerAdapterFactory("usi", createUSIEngine);
      bridge.registerAdapterFactory("gtp", createGTPEngine);
      bridge.registerAdapterFactory("edax", createEdaxEngine);
      bridge.registerAdapterFactory("mortal", createMortalEngine);
      bridge.registerAdapterFactory("gnubg", createGNUBGEngine);
      bridge.registerAdapterFactory("kingsrow", createKingsRowEngine);

      // Register specific engine factories
      // These will be used when calling bridge.getEngine("stockfish")
      bridge.registerAdapterFactory("stockfish", createStockfishEngine);
      bridge.registerAdapterFactory("yaneuraou", createYaneuraouEngine);
    }
    return bridge;
  })();

  return initPromise;
}
