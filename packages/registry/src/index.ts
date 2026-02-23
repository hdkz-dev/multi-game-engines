import { IEngineRegistry, IEngineSourceConfig } from "@multi-game-engines/core";
import enginesData from "../data/engines.json" with { type: "json" };

/**
 * プロジェクト同梱の JSON ファイルを使用する静的エンジンレジストリ。
 */
export class StaticRegistry implements IEngineRegistry {
  resolve(
    id: string,
    version?: string,
  ): Record<string, IEngineSourceConfig> | null {
    const engines = enginesData.engines as Record<string, unknown>;
    const engineEntry = engines[id] as
      | Record<string, string | Record<string, unknown>>
      | undefined;
    if (!engineEntry) return null;

    const targetVersion = (version || engineEntry["latest"]) as string;
    const versions = engineEntry["versions"] as Record<string, unknown>;
    const versionEntry = versions[targetVersion] as
      | Record<string, unknown>
      | undefined;
    if (!versionEntry) return null;

    return versionEntry["assets"] as Record<string, IEngineSourceConfig>;
  }

  getSupportedEngines(): string[] {
    return Object.keys(enginesData.engines);
  }
}

/**
 * デフォルトのレジストリインスタンス。
 */
export const OfficialRegistry = new StaticRegistry();
