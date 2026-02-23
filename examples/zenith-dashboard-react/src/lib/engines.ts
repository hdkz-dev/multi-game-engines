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

let bridge: EngineBridge | null = null;
let initPromise: Promise<EngineBridge | null> | null = null;

export async function getBridge(): Promise<EngineBridge | null> {
  if (typeof window === "undefined") return null;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!bridge) {
      bridge = new EngineBridge();

      // 2026 Best Practice: セントラルレジストリを登録し、メタデータ解決を有効化
      bridge.addRegistry(OfficialRegistry);

      // Register generic adapter factories
      // This allows dynamic instantiation via getEngine({ adapter: "uci", ... })
      bridge.registerAdapterFactory("uci", (config) => new UCIAdapter(config));
      bridge.registerAdapterFactory("usi", (config) => new USIAdapter(config));
      bridge.registerAdapterFactory("gtp", (config) => new GTPAdapter(config));
      bridge.registerAdapterFactory(
        "edax",
        (config) => new EdaxAdapter(config),
      );
      bridge.registerAdapterFactory(
        "mortal",
        (config) => new MortalAdapter(config),
      );
      bridge.registerAdapterFactory(
        "gnubg",
        (config) => new GNUBGAdapter(config),
      );
      bridge.registerAdapterFactory(
        "kingsrow",
        (config) => new KingsRowAdapter(config),
      );

      // Register specific engine factories
      // These will be used when calling bridge.getEngine("stockfish")
      bridge.registerAdapterFactory(
        "stockfish",
        (config) => new StockfishAdapter(config),
      );
      bridge.registerAdapterFactory(
        "yaneuraou",
        (config) => new YaneuraouAdapter(config),
      );
    }
    return bridge;
  })();

  return initPromise;
}
