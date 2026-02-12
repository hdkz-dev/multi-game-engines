import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { KataGoAdapter } from "../katago.js";
import { IEngineLoader, EngineStatus } from "@multi-game-engines/core";
import { Move } from "../GTPParser.js";

describe("KataGoAdapter", () => {
  let currentMockWorker: MockWorker | null = null;

  class MockWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage: ((ev: { data: unknown }) => void) | null = null;
    onerror: any = null;
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    constructor() {
      currentMockWorker = this;
    }
  }

  beforeEach(() => {
    currentMockWorker = null;
    vi.stubGlobal("Worker", MockWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockLoader: IEngineLoader = {
    loadResource: vi.fn().mockImplementation((id, config) => Promise.resolve(`blob://${config.url}`)),
    loadResources: vi.fn().mockImplementation((id, configs) => {
      const results: any = {};
      for (const key in configs) {
        results[key] = `blob://${configs[key].url}`;
      }
      return Promise.resolve(results);
    }),
    revoke: vi.fn(),
  };

  it("WASM とウェイトファイルを並列でロードし初期化できること", async () => {
    const adapter = new KataGoAdapter();
    const loadPromise = adapter.load(mockLoader);

    // ロード中状態
    expect(adapter.status).toBe("loading" as EngineStatus);

    // Worker からの 'ready' メッセージをシミュレート
    await vi.waitFor(() => expect(currentMockWorker).not.toBeNull());
    currentMockWorker!.onmessage!({ data: "ready" });

    await loadPromise;
    expect(adapter.status).toBe("ready" as EngineStatus);
    expect(mockLoader.loadResources).toHaveBeenCalledTimes(1);
  });

  it("GTP 延長コマンドを用いて探索を開始できること", async () => {
    const adapter = new KataGoAdapter();
    // 擬似的なロード完了 (内部プロパティへのアクセスは型キャストで安全に)
    const privAdapter = adapter as unknown as { 
      communicator: { postMessage: any; onMessage: any };
      _status: string;
    };
    privAdapter.communicator = {
      postMessage: vi.fn(),
      onMessage: vi.fn().mockReturnValue(() => {}),
    };
    privAdapter._status = "ready";

    const task = adapter.searchRaw("lz-analyze 50");
    expect(adapter.status).toBe("busy" as EngineStatus);
    expect((adapter as any).communicator.postMessage).toHaveBeenCalledWith("lz-analyze 50");
  });

  it("破棄時に複数の Blob URL を全て解放すること", async () => {
    const adapter = new KataGoAdapter();
    const loadPromise = adapter.load(mockLoader);
    await vi.waitFor(() => expect(currentMockWorker).not.toBeNull());
    currentMockWorker!.onmessage!({ data: "ready" });
    await loadPromise;

    await adapter.dispose();

    expect(mockLoader.revoke).toHaveBeenCalledTimes(2);
    expect(adapter.status).toBe("terminated" as EngineStatus);
  });
});
