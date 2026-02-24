import { IEngineRegistry, IEngineSourceConfig } from "@multi-game-engines/core";
import enginesData from "../data/engines.json" with { type: "json" };

/**
 * プロジェクト同梱の JSON ファイルを使用する静的エンジンレジストリ。
 */
export class StaticRegistry implements IEngineRegistry {
  protected data: Record<string, unknown>;

  constructor(data: unknown = enginesData) {
    // 2026 Best Practice: 実行時のデータ型検証 (Robustness)
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      console.warn(
        "[StaticRegistry] Invalid data format. Falling back to bundled engines data.",
      );
      this.data = enginesData as Record<string, unknown>;
    } else {
      this.data = data as Record<string, unknown>;
    }
  }

  resolve(
    id: string,
    version?: string,
  ): Record<string, IEngineSourceConfig> | null {
    const engines = this.data["engines"] as Record<string, unknown> | undefined;
    if (!engines) return null;

    const engineEntry = engines[id] as Record<string, unknown> | undefined;
    if (!engineEntry) return null;

    const targetVersion = (version || engineEntry["latest"]) as string;
    const versions = engineEntry["versions"] as Record<string, unknown>;
    if (!versions) return null;

    const versionEntry = versions[targetVersion] as
      | Record<string, unknown>
      | undefined;
    if (!versionEntry) return null;

    return versionEntry["assets"] as Record<string, IEngineSourceConfig>;
  }

  getSupportedEngines(): string[] {
    const engines = this.data["engines"] as Record<string, unknown> | undefined;
    return engines ? Object.keys(engines) : [];
  }
}

/**
 * 実行時に外部 URL からマニフェストを取得する動的エンジンレジストリ。
 */
export class RemoteRegistry extends StaticRegistry {
  private static readonly FETCH_TIMEOUT_MS = 10_000;
  private url: string;
  private loaded = false;

  constructor(url: string) {
    super({}); // 初期状態は空
    this.url = url;
  }

  /**
   * 外部マニフェストをロードします。
   */
  async load(): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      RemoteRegistry.FETCH_TIMEOUT_MS,
    );

    try {
      const response = await fetch(this.url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(
          `[RemoteRegistry] Failed to fetch manifest from ${this.url}: ${response.statusText}`,
        );
      }

      const parsed: unknown = await response.json();

      // 2026 Best Practice: 簡易スキーマ検証 (Discriminated Union / Zod 等の代替)
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        !("engines" in parsed)
      ) {
        throw new Error(
          `[RemoteRegistry] Invalid manifest format from ${this.url}. Missing "engines" field.`,
        );
      }

      this.data = parsed as Record<string, unknown>;
      this.loaded = true;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new Error(
          `[RemoteRegistry] Timeout fetching manifest from ${this.url} after ${RemoteRegistry.FETCH_TIMEOUT_MS}ms`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  override resolve(
    id: string,
    version?: string,
  ): Record<string, IEngineSourceConfig> | null {
    if (!this.loaded) {
      console.warn(
        `[RemoteRegistry] resolve() called before load() for engine "${id}". Returning null.`,
      );
      return null;
    }
    return super.resolve(id, version);
  }

  override getSupportedEngines(): string[] {
    if (!this.loaded) return [];
    return super.getSupportedEngines();
  }
}

/**
 * デフォルトのレジストリインスタンス。
 */
export const OfficialRegistry = new StaticRegistry();
