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

export function getBridge() {
  if (typeof window === "undefined") return null;

  if (!bridge) {
    bridge = new EngineBridge();

    // 2026 Zenith Tier: 汎用アダプターファクトリの登録
    // これにより、IEngineConfig を渡すだけで動的にエンジンを生成可能になります
    bridge.registerAdapterFactory("uci", createUCIEngine);
    bridge.registerAdapterFactory("usi", createUSIEngine);
    bridge.registerAdapterFactory("gtp", createGTPEngine);
    bridge.registerAdapterFactory("edax", createEdaxEngine);
    bridge.registerAdapterFactory("mortal", createMortalEngine);
    bridge.registerAdapterFactory("gnubg", createGNUBGEngine);
    bridge.registerAdapterFactory("kingsrow", createKingsRowEngine);

    // デフォルトアダプターの登録
    bridge.registerAdapter(new StockfishAdapter()).catch((err) => {
      console.error(
        `[EngineBridge] StockfishAdapter の登録に失敗しました: ${truncateLog(String(err))}`,
      );
    });
    bridge.registerAdapter(new YaneuraouAdapter()).catch((err) => {
      console.error(
        `[EngineBridge] YaneuraouAdapter の登録に失敗しました: ${truncateLog(String(err))}`,
      );
    });
  }
  return bridge;
}
