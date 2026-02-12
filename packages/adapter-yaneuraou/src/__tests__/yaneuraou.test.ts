import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { YaneuraOuAdapter } from "../yaneuraou.js";
import { IEngineLoader } from "@multi-game-engines/core";

describe("YaneuraOuAdapter", () => {
  let adapter: YaneuraOuAdapter;
  let mockLoader: IEngineLoader;
  let currentMockWorker: MockWorker | null = null;

  class MockWorker implements Worker {
    onmessage: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
    onerror: ((this: AbstractWorker, ev: ErrorEvent) => unknown) | null = null;
    onmessageerror: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
    
    postMessage = vi.fn((msg: unknown) => {
      if (msg === "usi") {
        setTimeout(() => this.triggerMessage("usiok"), 10);
      } else if (typeof msg === "string" && msg.startsWith("position")) {
        // Prepare
      } else if (typeof msg === "string" && msg.startsWith("go")) {
        const isLongSearch = msg.includes("depth 100");
        setTimeout(() => this.triggerMessage("info depth 1 score cp 10"), 10);
        if (!isLongSearch) {
          setTimeout(() => this.triggerMessage("bestmove 7g7f"), 20);
        }
      } else if (msg === "stop") {
        // handled
      }
    });

    terminate = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    dispatchEvent = vi.fn().mockReturnValue(true);

    triggerMessage(data: unknown) {
      if (this.onmessage) {
        this.onmessage({ data } as MessageEvent);
      }
    }
  }

  beforeEach(() => {
    currentMockWorker = null;
    
    // 2026 Best Practice: Factory function mock to capture instance without `this` aliasing
    vi.stubGlobal("Worker", vi.fn().mockImplementation(function() {
      const worker = new MockWorker();
      currentMockWorker = worker;
      return worker;
    }));
    
    adapter = new YaneuraOuAdapter();
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:mock-url"),
      revoke: vi.fn(),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should have correct metadata", () => {
    expect(adapter.id).toBe("yaneuraou");
    expect(adapter.name).toBe("YaneuraOu");
  });

  it("should initialize correctly with load()", async () => {
    // load() は内部で USI プロトコルの初期化ハンドシェイク (usi -> usiok) を行います
    await adapter.load(mockLoader);
    
    expect(mockLoader.loadResource).toHaveBeenCalledWith("yaneuraou", adapter.sources.main);
    expect(currentMockWorker?.postMessage).toHaveBeenCalledWith("usi");
    expect(adapter.status).toBe("ready");
  });

  it("should perform search correctly via USI", async () => {
    await adapter.load(mockLoader);

    // 探索コマンド送信
    const task = adapter.searchRaw("go depth 1");
    
    // Verify info stream: 思考中の情報 (info) がストリーム経由で取得できること
    const infoReader = task.info[Symbol.asyncIterator]();
    const firstInfo = await infoReader.next();
    expect(firstInfo.value).toMatchObject({ depth: 1, score: 10 });

    // Verify result: 最終結果 (bestmove) が Promise で解決されること
    const result = await task.result;
    expect(result.bestMove).toBe("7g7f");
  });

  it("should stop search correctly", async () => {
    await adapter.load(mockLoader);

    const task = adapter.searchRaw("go depth 100");
    await adapter.stop();

    expect(currentMockWorker?.postMessage).toHaveBeenCalledWith("stop");
    // 停止時はタスクが Reject される仕様
    await expect(task.result).rejects.toThrow("Search aborted");
  });
});
