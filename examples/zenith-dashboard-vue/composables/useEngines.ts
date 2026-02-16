import { EngineBridge } from "@multi-game-engines/core";
import { StockfishAdapter } from "@multi-game-engines/adapter-stockfish";
import { YaneuraouAdapter } from "@multi-game-engines/adapter-yaneuraou";

let bridge: EngineBridge | null = null;

export function getBridge(): EngineBridge | null {
  if (import.meta.server) return null;

  if (!bridge) {
    bridge = new EngineBridge();
    void bridge.registerAdapter(new StockfishAdapter());
    void bridge.registerAdapter(new YaneuraouAdapter());
  }
  return bridge;
}
