import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import { MockAdapter } from "../../mocks/MockAdapter.js";
import {
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineErrorCode,
  IMiddleware,
} from "../../types.js";

describe("EngineFacade Edge Cases: Concurrency & Lifecycle", () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ id: "test-engine" });
    adapter.setCommunicator({
      postMessage: vi.fn(),
      onMessage: vi.fn(),
      terminate: vi.fn(),
    });
  });

  it("アトミック・ロード: 同時に load() を呼んでも、アダプターの load は一度しか呼ばれないこと (Race Condition)", async () => {
    const loadSpy = vi
      .spyOn(adapter, "load")
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50)),
      );
    const facade = new EngineFacade(adapter);

    const p1 = facade.load();
    const p2 = facade.load();

    await Promise.all([p1, p2]);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("探索中に dispose() が呼ばれた場合、探索が適切に中断されリソースが解放されること (Interruption)", async () => {
    adapter.setStatus("ready");
    const facade = new EngineFacade(adapter);

    // 物理的修正: searchPromise が投げるエラーを確実にキャッチするように待機
    const searchPromise = facade.search({} as IBaseSearchOptions);

    // 中断を誘発
    await facade.dispose();

    // searchPromise のリジェクトを物理的に確実にハンドル
    await expect(searchPromise).rejects.toThrow(
      expect.objectContaining({ code: EngineErrorCode.CANCELLED }),
    );
  });

  it("ミドルウェアが例外を投げた際の絶縁性 (Fault Tolerance)", async () => {
    adapter.setStatus("ready");
    const buggyMw: IMiddleware<IBaseSearchOptions, unknown, IBaseSearchResult> =
      {
        id: "buggy",
        onSearch: () => {
          throw new Error("Mw error");
        },
        onCommand: vi.fn(),
      };

    const facade = new EngineFacade(adapter, [buggyMw]);
    const searchPromise = facade.search({} as IBaseSearchOptions);

    adapter.setStatus("busy");
    adapter.testHandleIncomingMessage("bestmove e2e4");

    const result = await searchPromise;
    expect(result.bestMove).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((buggyMw as any).onCommand).toHaveBeenCalled();
  });

  it("多重 dispose() 呼び出しが安全であること (Idempotency)", async () => {
    const facade = new EngineFacade(adapter);
    vi.spyOn(adapter, "dispose");

    await facade.dispose();
    await facade.dispose();

    expect(adapter.dispose).toHaveBeenCalledTimes(1);
  });
});
