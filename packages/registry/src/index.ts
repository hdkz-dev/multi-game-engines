import { IEngineRegistry, IEngineSourceConfig } from "@multi-game-engines/core";
import enginesData from "../data/engines.json" with { type: "json" };
import { t as translate } from "@multi-game-engines/i18n";
import { z } from "zod";

/**
 * エンジンソース設定の Zod スキーマ。
 */
const EngineSourceSchema = z.object({
  url: z.string().url(),
  sri: z
    .string()
    .regex(/^sha(256|384|512)-[A-Za-z0-9+/]{43,88}={0,2}$/)
    .optional(),
  __unsafeNoSRI: z.boolean().optional(),
  type: z.enum(["worker-js", "wasm", "data"]),
  mountPath: z.string().optional(),
});

/**
 * エンジンマニフェスト（engines.json）の Zod スキーマ。
 */
const EngineManifestSchema = z.object({
  version: z.string(),
  engines: z.record(
    z.string(),
    z.object({
      name: z.string(),
      adapter: z.string(),
      latest: z.string(),
      versions: z.record(
        z.string(),
        z.object({
          assets: z.record(z.string(), EngineSourceSchema),
        }),
      ),
    }),
  ),
});

type EngineManifest = z.infer<typeof EngineManifestSchema>;

/**
 * プロジェクト同梱の JSON ファイルを使用する静的エンジンレジストリ。
 */
export class StaticRegistry implements IEngineRegistry {
  protected data: EngineManifest;

  constructor(data: unknown = enginesData) {
    // 2026 Best Practice: 起動時または登録時に Zod で構造を厳密に検証
    const result = EngineManifestSchema.safeParse(data);
    if (!result.success) {
      console.warn(
        translate("engine.errors.registry.invalidManifest", {
          error: result.error.message,
        }),
      );
      // 万が一外部からのデータが壊れている場合は同梱のデータを（それ自体が正しければ）使用
      this.data = enginesData as unknown as EngineManifest;
    } else {
      this.data = result.data;
    }
  }

  resolve(
    id: string,
    version?: string,
  ): Record<string, IEngineSourceConfig> | null {
    const engineEntry = this.data.engines[id];
    if (!engineEntry) return null;

    const targetVersion = version || engineEntry.latest;
    const versionEntry = engineEntry.versions[targetVersion];
    if (!versionEntry) return null;

    return versionEntry.assets as Record<string, IEngineSourceConfig>;
  }

  getSupportedEngines(): string[] {
    return Object.keys(this.data.engines);
  }
}

/**
 * 実行時に外部 URL からマニフェストを取得する動的エンジンレジストリ。
 */
export class RemoteRegistry extends StaticRegistry {
  private static readonly FETCH_TIMEOUT_MS = 10_000;
  private url: string;
  private expectedSri: string | undefined;
  private loaded = false;

  constructor(url: string, expectedSri?: string) {
    super({ version: "0.0.0", engines: {} }); // 初期状態は最小限の有効な構造
    this.url = url;
    this.expectedSri = expectedSri;
  }

  /**
   * ロード済みかどうかを返します。
   */
  get isLoaded(): boolean {
    return this.loaded;
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
          translate("engine.errors.registry.fetchFailed", {
            url: this.url,
            status: response.statusText,
          }),
        );
      }

      // 2026 Zenith Tier: リモートマニフェスト自体の SRI 検証
      const body = await response.arrayBuffer();
      if (this.expectedSri) {
        await this.verifySri(body, this.expectedSri);
      }

      const decoder = new TextDecoder();
      const parsed: unknown = JSON.parse(decoder.decode(body));

      // 2026 Zenith Tier: Zod による厳密なスキーマバリデーション
      const result = EngineManifestSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          translate("engine.errors.registry.invalidFormat", {
            url: this.url,
            error: result.error.message,
          }),
        );
      }

      this.data = result.data;
      this.loaded = true;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new Error(
          translate("engine.errors.registry.timeout", {
            url: this.url,
            timeout: RemoteRegistry.FETCH_TIMEOUT_MS,
          }),
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 取得したバイナリデータと期待される SRI ハッシュを比較検証します。
   */
  private async verifySri(
    buffer: ArrayBuffer,
    expectedSri: string,
  ): Promise<void> {
    const parts = expectedSri.split("-");
    if (parts.length !== 2) {
      throw new Error(`[RemoteRegistry] Invalid SRI format: ${expectedSri}`);
    }

    const [algo, expectedHash] = parts;
    let cryptoAlgo: string;

    if (algo === "sha256") cryptoAlgo = "SHA-256";
    else if (algo === "sha384") cryptoAlgo = "SHA-384";
    else if (algo === "sha512") cryptoAlgo = "SHA-512";
    else {
      throw new Error(`[RemoteRegistry] Unsupported SRI algorithm: ${algo}`);
    }

    const hashBuffer = await globalThis.crypto.subtle.digest(
      cryptoAlgo,
      buffer,
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashString = String.fromCharCode(...hashArray);
    const actualHash = btoa(hashString);

    if (actualHash !== expectedHash) {
      throw new Error(
        translate("engine.errors.registry.sriMismatch", { url: this.url }),
      );
    }
  }

  override resolve(
    id: string,
    version?: string,
  ): Record<string, IEngineSourceConfig> | null {
    if (!this.loaded) {
      console.warn(translate("engine.errors.registry.notLoaded", { id }));
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
