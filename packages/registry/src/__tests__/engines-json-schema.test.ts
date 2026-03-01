import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StaticRegistry } from "../index.js";
import enginesData from "../../data/engines.json" with { type: "json" };

/**
 * engines.json が EngineManifestSchema に準拠しているかの統合テスト。
 *
 * - 全エンジンが正しいスキーマで定義されていること
 * - SRI discriminated union（sri | __unsafeNoSRI）が正しいこと
 * - 各アセットに必須フィールドが含まれていること
 */
describe("engines.json schema validation", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(1234.56);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should pass EngineManifestSchema validation via StaticRegistry constructor", () => {
    // StaticRegistry は constructor 内で Zod バリデーションを実施する。
    // 不正なスキーマの場合は console.warn が発行され、フォールバックになる。
    
    const registry = new StaticRegistry(enginesData);
    // warn が呼ばれていない → スキーマ検証成功
    expect(warnSpy).not.toHaveBeenCalled();
    
    // 基本的な統合チェック
    expect(registry.getSupportedEngines().length).toBeGreaterThan(0);
  });

  it("should have version field in manifest", () => {
    expect(enginesData.version).toBeDefined();
    expect(typeof enginesData.version).toBe("string");
  });

  it("should have at least one engine defined", () => {
    expect(Object.keys(enginesData.engines).length).toBeGreaterThan(0);
  });

  describe("each engine entry", () => {
    const engineEntries = Object.entries(enginesData.engines);

    it.each(engineEntries)(
      "'%s' should have required fields (name, adapter, latest, versions)",
      (_id, engine) => {
        expect(engine.name).toBeDefined();
        expect(typeof engine.name).toBe("string");
        expect(engine.adapter).toBeDefined();
        expect(typeof engine.adapter).toBe("string");
        expect(engine.latest).toBeDefined();
        expect(typeof engine.latest).toBe("string");
        expect(engine.versions).toBeDefined();
        expect(typeof engine.versions).toBe("object");
      },
    );

    it.each(engineEntries)(
      "'%s' latest version should exist in versions",
      (_id, engine) => {
        const versions = engine.versions as Record<string, unknown>;
        expect(versions[engine.latest]).toBeDefined();
      },
    );

    it.each(engineEntries)(
      "'%s' should have a 'main' asset in its latest version",
      (_id, engine) => {
        const versions = engine.versions as Record<
          string,
          { assets: Record<string, unknown> }
        >;
        const latestVersion = versions[engine.latest];
        expect(latestVersion?.assets?.main).toBeDefined();
      },
    );
  });

  describe("each asset entry", () => {
    const assetEntries: [string, Record<string, unknown>][] = [];
    for (const [engineId, engine] of Object.entries(enginesData.engines)) {
      for (const [versionId, version] of Object.entries(engine.versions)) {
        for (const [assetKey, asset] of Object.entries(version.assets)) {
          if (assetKey === "variants") continue; // variants はアセット自体ではないためスキップ
          assetEntries.push([
            `${engineId}/${versionId}/${assetKey}`,
            asset as Record<string, unknown>,
          ]);
        }
      }
    }

    it.each(assetEntries)(
      "'%s' should have valid url and type",
      (_label, asset) => {
        expect(asset.url).toBeDefined();
        expect(typeof asset.url).toBe("string");
        // http または data: URL を許容
        const isWebUrl = (asset.url as string).startsWith("http");
        const isDataUrl = (asset.url as string).startsWith("data:");
        expect(isWebUrl || isDataUrl).toBe(true);

        expect(asset.type).toBeDefined();
        const validTypes = [
          "worker-js",
          "wasm",
          "eval-data",
          "native",
          "webgpu-compute",
          "json",
          "text",
          "asset",
        ];
        expect(validTypes).toContain(asset.type);
      },
    );

    it.each(assetEntries)(
      "'%s' should satisfy SRI discriminated union (sri XOR __unsafeNoSRI)",
      (_label, asset) => {
        const hasSri =
          typeof asset.sri === "string" && (asset.sri as string).length > 0;
        const hasUnsafeNoSRI = asset.__unsafeNoSRI === true;

        // 排他的: どちらか一方のみ
        expect(hasSri || hasUnsafeNoSRI).toBe(true);
        expect(hasSri && hasUnsafeNoSRI).toBe(false);
      },
    );

    it.each(
      assetEntries.filter(
        ([, asset]) =>
          typeof asset.sri === "string" && (asset.sri as string).length > 0,
      ),
    )("'%s' SRI hash should match expected pattern", (_label, asset) => {
      const sriPattern = /^sha(256|384|512)-[A-Za-z0-9+/]{43,88}={0,2}$/;
      expect((asset.sri as string).match(sriPattern)).not.toBeNull();
    });
  });

  it("should reject invalid manifest data", () => {
    
    // 不正なデータを渡す
    new StaticRegistry({ invalid: true });
    // バリデーション失敗で warn が呼ばれる
    expect(warnSpy).toHaveBeenCalled();
    
  });

  it("should reject manifest with missing version field", () => {
    
    new StaticRegistry({ engines: {} });
    expect(warnSpy).toHaveBeenCalled();
    
  });

  it("should reject manifest with invalid engine structure", () => {
    
    new StaticRegistry({
      version: "1.0.0",
      engines: {
        bad: { name: 123 }, // name should be string
      },
    });
    expect(warnSpy).toHaveBeenCalled();
    
  });

  it("should recursively validate deep nested properties like assets", () => {
    new StaticRegistry({
      version: "1.0.0",
      engines: {
        foo: {
          name: "foo",
          adapter: "mock",
          latest: "1.0.0",
          versions: {
            "1.0.0": {
              assets: {
                main: { url: "http://example.com/main.js", type: "invalid-type", sri: "invalid-sri" }
              }
            }
          }
        }
      }
    });
    expect(warnSpy).toHaveBeenCalled();
  });
});
