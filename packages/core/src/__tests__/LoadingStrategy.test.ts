import { describe, it, expect, vi } from "vitest";
import { EngineFacade } from "../bridge/EngineFacade";
import { IEngineAdapter, IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult, EngineStatus } from "../types.js";

interface IMockResult extends IBaseSearchResult {
  move: string;
}

describe("EngineFacade Loading Strategies", () => {
  const createMockAdapter = () => {
    let status: EngineStatus = "uninitialized";
    const listeners = new Set<(s: EngineStatus) => void>();

    return {
      id: "test-engine",
      name: "Mock Engine",
      version: "1.0.0",
      get status() { return status; },
      load: vi.fn().mockImplementation(async () => {
        status = "loading";
        listeners.forEach(l => l(status));
        await new Promise(resolve => setTimeout(resolve, 50));
        status = "ready";
        listeners.forEach(l => l(status));
      }),
      searchRaw: vi.fn().mockImplementation(() => ({
        info: (async function* () {})(),
        result: Promise.resolve({ move: "e2e4", raw: "bestmove e2e4" } as IMockResult),
        stop: vi.fn(),
      })),
      onStatusChange: vi.fn().mockImplementation((cb) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      }),
      onProgress: vi.fn().mockReturnValue(() => {}),
      parser: {
        createSearchCommand: vi.fn().mockReturnValue("go"),
      }
    } as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IMockResult>;
  };

  it("Manual Strategy: should throw error if not loaded", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    facade.loadingStrategy = "manual";

    await expect(facade.search({})).rejects.toThrow(/Call load\(\) first/);
  });

  it("On-demand Strategy: should auto-load on search", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    facade.loadingStrategy = "on-demand";

    const result = await facade.search({});
    
    expect(adapter.load).toHaveBeenCalled();
    expect((result as IMockResult).move).toBe("e2e4");
  });

  it("Eager Strategy: should load immediately when set", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    
    facade.loadingStrategy = "eager";
    
    expect(adapter.load).toHaveBeenCalled();
  });

  it("should wait for concurrent loading during search", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    facade.loadingStrategy = "on-demand";

    // 1回目の検索（自動ロード開始）
    const search1 = facade.search({});
    // 少し待ってから2回目の検索（ロード中のはず）
    await new Promise(resolve => setTimeout(resolve, 10));
    const search2 = facade.search({});

    await Promise.all([search1, search2]);
    
    expect(adapter.load).toHaveBeenCalledTimes(1);
  });
});
