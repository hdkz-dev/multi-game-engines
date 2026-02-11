import { describe, it, expect, vi } from "vitest";
import { EngineBridge } from "../bridge/EngineBridge";
import { BaseAdapter } from "../adapters/BaseAdapter";
import { ISearchTask, IBaseSearchInfo, IBaseSearchResult, IMiddleware, FEN, Move } from "../types";
import { UCIParser } from "../protocols/UCIParser";

/**
 * 徹底的に型定義されたテスト用モックアダプター。
 * UCI プロトコルを模擬し、ストリーミング出力を検証可能にします。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class MockAdapter extends BaseAdapter<any, IBaseSearchInfo, IBaseSearchResult> {
  readonly id = "mock";
  readonly name = "Mock Engine";
  readonly version = "1.0";
  readonly engineLicense = { name: "MIT", url: "" };
  readonly adapterLicense = { name: "MIT", url: "" };
  readonly sources = {};
  readonly parser = new UCIParser();

  async load() {
    this.emitStatusChange("ready");
  }

  /** 手動で制御可能なストリーミング出力を生成 */
  searchRaw(_command: string | Uint8Array): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    const infoStream = new ReadableStream<IBaseSearchInfo>({
      start(controller) {
        controller.enqueue({ depth: 1, score: 10 });
        controller.close();
      }
    });

    const infoAsyncIterable: AsyncIterable<IBaseSearchInfo> = {
      [Symbol.asyncIterator]: () => {
        const reader = infoStream.getReader();
        return {
          async next() {
            const { done, value } = await reader.read();
            if (done) return { done: true, value: undefined };
            return { done: false, value: value! };
          }
        };
      }
    };

    return {
      info: infoAsyncIterable,
      result: Promise.resolve({ bestMove: "e2e4" as Move }),
      stop: async () => {}
    };
  }

  async dispose() {}
}

describe("EngineBridge & EngineFacade", () => {
  it("should support independent listener unsubscription", async () => {
    const adapter = new MockAdapter();
    const listener = vi.fn();
    
    // 購読開始
    const unsubscribe = adapter.onStatusChange(listener);
    expect(listener).toHaveBeenCalledWith("idle");

    // 購読解除
    unsubscribe();
    await adapter.load();
    
    // 解除後は通知されないことを確認
    expect(listener).not.toHaveBeenCalledWith("ready");
  });

  it("should apply middleware chain in the correct order", async () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter();
    bridge.registerAdapter(adapter);

    const middleware: IMiddleware<IBaseSearchInfo, IBaseSearchResult> = {
      onInfo: vi.fn(async (info) => ({ ...info, score: info.score + 100 })),
      onResult: vi.fn(async (result) => ({ ...result, bestMove: "d2d4" as Move })),
    };
    bridge.use(middleware);

    const engine = bridge.getEngine("mock");
    const task = await engine.search({ fen: "startpos" as FEN });

    for await (const info of task.info) {
      expect(info.score).toBe(110);
    }

    const result = await task.result;
    expect(result.bestMove).toBe("d2d4");
  });
});
