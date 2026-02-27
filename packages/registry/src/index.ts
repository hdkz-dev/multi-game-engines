import {
  IEngineRegistry,
  IEngineSourceConfig,
  EngineError,
  EngineErrorCode,
  I18nKey,
} from "@multi-game-engines/core";
import enginesData from "../data/engines.json" with { type: "json" };
import {
  tEngines as translate,
  EnginesKey,
} from "@multi-game-engines/i18n-engines";
import { z } from "zod";

/**
 * エンジンソース設定の Zod スキーマ。
 */
const EngineSourceSchema = z
  .object({
    url: z.string().url(),
    type: z.enum([
      "worker-js",
      "wasm",
      "eval-data",
      "native",
      "webgpu-compute",
      "json",
      "text",
      "asset",
    ]),
    size: z.number().optional(),
    mountPath: z.string().optional(),
  })
  .and(
    z.union([
      z.object({
        sri: z.string().regex(/^sha(256|384|512)-[A-Za-z0-9+/]{43,88}={0,2}$/),
        __unsafeNoSRI: z.undefined().optional(),
      }),
      z.object({
        sri: z.undefined().optional(),
        __unsafeNoSRI: z.literal(true),
      }),
    ]),
  );

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
 * 2026 Best Practice: オブジェクト型かどうかを判定する型ガード。
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * プロジェクト同梱の JSON ファイルを使用する静的エンジンレジストリ。
 */
export class StaticRegistry implements IEngineRegistry {
  protected data: EngineManifest;

  constructor(data: unknown = enginesData) {
    // 2026 Best Practice: 起動時または登録時に Zod で構造を厳密に検証
    const result = EngineManifestSchema.safeParse(data);
    if (!result.success) {
      const i18nKey: EnginesKey = "registry.invalidManifest";
      console.warn(
        translate(i18nKey, {
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

    // 2026 Zenith Tier: 直接キャストを避け、不透明な Record から安全に変換
    if (!isRecord(versionEntry.assets)) {
      const i18nKey: EnginesKey = "registry.invalidFormat";
      console.error(
        translate(i18nKey, { url: id, error: "assets is not a record" }),
      );
      return null;
    }

    return versionEntry.assets as unknown as Record<
      string,
      IEngineSourceConfig
    >;
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

  private loadingPromise: Promise<void> | null = null;

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
   * 同時呼び出し時は、実行中のリクエストを共有します。
   */
  async load(): Promise<void> {
    if (this.loaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        RemoteRegistry.FETCH_TIMEOUT_MS,
      );

      try {
        const response = await fetch(this.url, { signal: controller.signal });
        if (!response.ok) {
          const i18nKey: EnginesKey = "registry.fetchFailed";
          throw new EngineError({
            code: EngineErrorCode.NETWORK_ERROR,
            message: translate(i18nKey, {
              url: this.url,
              status: response.statusText,
            }),
            i18nKey: i18nKey as unknown as I18nKey,
          });
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
          const i18nKey: EnginesKey = "registry.invalidFormat";
          throw new EngineError({
            code: EngineErrorCode.VALIDATION_ERROR,
            message: translate(i18nKey, {
              url: this.url,
              error: result.error.message,
            }),
            i18nKey: i18nKey as unknown as I18nKey,
          });
        }

        this.data = result.data;
        this.loaded = true;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          const i18nKey: EnginesKey = "registry.timeout";
          throw new EngineError({
            code: EngineErrorCode.NETWORK_ERROR,
            message: translate(i18nKey, {
              url: this.url,
              timeout: RemoteRegistry.FETCH_TIMEOUT_MS,
            }),
            i18nKey: i18nKey as unknown as I18nKey,
          });
        }
        throw error;
      } finally {
        clearTimeout(timer);
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
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
      const i18nKey: EnginesKey = "registry.invalidSriFormat";
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: translate(i18nKey, { sri: expectedSri }),
        i18nKey: i18nKey as unknown as I18nKey,
      });
    }

    const [algo, expectedHash] = parts;
    let cryptoAlgo: string;

    if (algo === "sha256") cryptoAlgo = "SHA-256";
    else if (algo === "sha384") cryptoAlgo = "SHA-384";
    else if (algo === "sha512") cryptoAlgo = "SHA-512";
    else {
      const i18nKey: EnginesKey = "registry.unsupportedAlgorithm";
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: translate(i18nKey, { algo: algo ?? "unknown" }),
        i18nKey: i18nKey as unknown as I18nKey,
      });
    }

    const hashBuffer = await globalThis.crypto.subtle.digest(
      cryptoAlgo,
      buffer,
    );
    const actualHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

    if (actualHash !== expectedHash) {
      const i18nKey: EnginesKey = "registry.sriMismatch";
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: translate(i18nKey, { url: this.url }),
        i18nKey: i18nKey as unknown as I18nKey,
      });
    }
  }

  override resolve(
    id: string,
    version?: string,
  ): Record<string, IEngineSourceConfig> | null {
    if (!this.loaded) {
      const i18nKey: EnginesKey = "registry.notLoaded";
      console.warn(translate(i18nKey, { id }));
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
