import { EngineBridge } from "@multi-game-engines/core";
import { StockfishAdapter } from "@multi-game-engines/adapter-stockfish";
import { YaneuraouAdapter } from "@multi-game-engines/adapter-yaneuraou";

let bridge: EngineBridge | null = null;

/**
 * Returns a singleton EngineBridge instance.
 * Safe to call unconditionally — ssr: false ensures this only runs on the client.
 */
export function getBridge(): EngineBridge {
  if (!bridge) {
    bridge = new EngineBridge();
    void bridge.registerAdapter(new StockfishAdapter());
    void bridge.registerAdapter(new YaneuraouAdapter());
  }
  return bridge;
}
