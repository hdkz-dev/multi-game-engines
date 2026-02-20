import { EngineBridge } from "@multi-game-engines/core";
import { StockfishAdapter } from "@multi-game-engines/adapter-stockfish";
import { YaneuraouAdapter } from "@multi-game-engines/adapter-yaneuraou";
import { createUCIAdapter } from "@multi-game-engines/adapter-uci";
import { createUSIAdapter } from "@multi-game-engines/adapter-usi";
import { createGTPAdapter } from "@multi-game-engines/adapter-gtp";
import { createEdaxAdapter } from "@multi-game-engines/adapter-edax";
import { createMortalAdapter } from "@multi-game-engines/adapter-mortal";
import { createGNUBGAdapter } from "@multi-game-engines/adapter-gnubg";
import { createKingsRowAdapter } from "@multi-game-engines/adapter-kingsrow";

let bridge: EngineBridge | null = null;

export function getBridge() {
  if (typeof window === "undefined") return null;

  if (!bridge) {
    bridge = new EngineBridge();

    // 2026 Zenith Tier: 汎用アダプターファクトリの登録
    // これにより、IEngineConfig を渡すだけで動的にエンジンを生成可能になります
    bridge.registerAdapterFactory("uci", createUCIAdapter);
    bridge.registerAdapterFactory("usi", createUSIAdapter);
    bridge.registerAdapterFactory("gtp", createGTPAdapter);
    bridge.registerAdapterFactory("edax", createEdaxAdapter);
    bridge.registerAdapterFactory("mortal", createMortalAdapter);
    bridge.registerAdapterFactory("gnubg", createGNUBGAdapter);
    bridge.registerAdapterFactory("kingsrow", createKingsRowAdapter);

    // デフォルトアダプターの登録
    void bridge.registerAdapter(new StockfishAdapter());
    void bridge.registerAdapter(new YaneuraouAdapter());
  }
  return bridge;
}
