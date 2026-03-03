import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import {
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineErrorCode,
} from "../../types.js";
import { createDeferred } from "../../utils/deferred.js";

describe("EngineFacade: Advanced Race Conditions & Stress Tests", () => {
  let adapter: unknown;
  let mockLoader: unknown;

  beforeEach(() => {
    adapter = {
      id: "race-engine",
      name: "Race Engine",
      status: "uninitialized",
      load: vi.fn().mockResolvedValue(undefined),
      setOption: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue({ raw: "result", bestMove: "e2e4" }),
      searchRaw: vi.fn().mockImplementation(() => ({
        info: (async function* () {
          yield { depth: 1 };
        })(),
        result: Promise.resolve({ raw: "result", bestMove: "e2e4" }),
        stop: vi.fn(),
      })),
      stop: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn().mockResolvedValue(undefined),
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onTelemetry: vi.fn().mockReturnValue(() => {}),
      onInfo: vi.fn().mockReturnValue(() => {}),
      onSearchResult: vi.fn().mockReturnValue(() => {}),
      updateStatus: vi.fn(),
      parser: {
        createSearchCommand: vi.fn().mockReturnValue("go"),
      }
    };

    mockLoader = {
      loadResource: vi.fn().mockResolvedValue({ main: "blob:url" }),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
  });

  it("アトミック・ロード: 同時に load() を呼んでも、アダプターの load は一度しか呼ばれないこと", async () => {
    adapter.load.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)));
    const facade = new EngineFacade(adapter, [], () => Promise.resolve(mockLoader));

    const p1 = facade.load();
    const p2 = facade.load();
    const p3 = facade.load();

    await Promise.all([p1, p2, p3]);
    expect(adapter.load).toHaveBeenCalledTimes(1);
  });

  it("探索リクエストが並行して飛んだ際、BUSY エラーで適切に拒否されること", async () => {
    adapter.status = "ready";
    const facade = new EngineFacade(adapter);
    
    // 完了しない探索
    const searchDeferred = createDeferred<IBaseSearchResult>();
    adapter.searchRaw.mockReturnValue({
      info: (async function* () {})(),
      result: searchDeferred.promise,
      stop: vi.fn(),
    });

    const p1 = facade.search({} as unknown);
    const p2 = facade.search({} as unknown);

    await expect(p2).rejects.toThrow(
      expect.objectContaining({ code: EngineErrorCode.BUSY })
    );

    searchDeferred.resolve({ raw: "ok", bestMove: "e2e4" } as unknown);
    await p1;
  });
});
