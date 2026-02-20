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

/**
 * Returns a singleton EngineBridge instance.
 * Safe to call unconditionally — ssr: false ensures this only runs on the client.
 */
export function getBridge(): EngineBridge | null {
  if (typeof window === "undefined") return null;

  if (!bridge) {
    bridge = new EngineBridge();

    // 2026 Zenith Tier: 汎用アダプターファクトリの登録
    bridge.registerAdapterFactory("uci", createUCIAdapter);
    bridge.registerAdapterFactory("usi", createUSIAdapter);
    bridge.registerAdapterFactory("gtp", createGTPAdapter);
    bridge.registerAdapterFactory("edax", createEdaxAdapter);
    bridge.registerAdapterFactory("mortal", createMortalAdapter);
    bridge.registerAdapterFactory("gnubg", createGNUBGAdapter);
    bridge.registerAdapterFactory("kingsrow", createKingsRowAdapter);

    // 2026 Zenith Tier: デフォルトアダプターの登録。
    // 非同期で実行し、失敗時はコンソールに警告を出力します（初期化をブロックしない設計判断）。
    bridge.registerAdapter(new StockfishAdapter()).catch((e) => {
      console.warn("[Dashboard] Failed to register Stockfish adapter:", e);
    });
    bridge.registerAdapter(new YaneuraouAdapter()).catch((e) => {
      console.warn("[Dashboard] Failed to register Yaneuraou adapter:", e);
    });
  }
  return bridge;
}
