import { describe, it, expect, vi } from "vitest";
import { EngineFacade } from "../bridge/EngineFacade.js";
import {
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "../types.js";

describe("Loading Strategies", () => {
  const createMockAdapter = () =>
    ({
      id: "test",
      status: "uninitialized",
      parser: { createSearchCommand: () => "go" },
      load: vi.fn().mockImplementation(function (this: { status: string }) {
        this.status = "ready";
        return Promise.resolve();
      }),
      searchRaw: vi.fn().mockReturnValue({
        info: (async function* () {
          yield { raw: "info" } as IBaseSearchInfo;
        })(),
        result: Promise.resolve({ raw: "result" } as IBaseSearchResult),
        stop: vi.fn(),
      }),
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onProgress: vi.fn().mockReturnValue(() => {}),
    }) as unknown as IEngineAdapter<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

  it("'on-demand' 戦略の場合、search() 時に自動で load() が呼ばれること", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    facade.loadingStrategy = "on-demand";

    expect(adapter.load).not.toHaveBeenCalled();

    await facade.search({});

    expect(adapter.load).toHaveBeenCalled();
  });

  it("'manual' 戦略の場合、未ロードで search() を呼ぶとエラーになること", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    facade.loadingStrategy = "manual";

    await expect(facade.search({})).rejects.toThrow(
      /Engine is not initialized/,
    );
  });

  it("'eager' 戦略の場合、プロパティ設定時に load() が開始されること", () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);

    facade.loadingStrategy = "eager";

    expect(adapter.load).toHaveBeenCalled();
  });
});
