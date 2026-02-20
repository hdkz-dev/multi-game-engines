import { EngineBridge } from "@multi-game-engines/core";
import {
  StockfishAdapter,
  createUCIAdapter,
} from "@multi-game-engines/adapter-stockfish";
import {
  YaneuraouAdapter,
  createUSIAdapter,
} from "@multi-game-engines/adapter-yaneuraou";
import { createGTPAdapter } from "@multi-game-engines/adapter-katago";

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

    // デフォルトアダプターの登録
    void bridge.registerAdapter(new StockfishAdapter());
    void bridge.registerAdapter(new YaneuraouAdapter());
  }
  return bridge;
}
