import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import {
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "../../types.js";

describe("Loading Strategies", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const createMockAdapter = () =>
    ({
      id: "test",
      status: "uninitialized",
      parser: { createSearchCommand: () => "go" },
      load: vi.fn().mockImplementation(function (this: { status: string }) {
        this.status = "ready";
        return Promise.resolve();
      }),
      searchRaw: vi.fn().mockImplementation(function (this: {
        status: string;
      }) {
        if (this.status !== "ready")
          throw new Error("Engine is not initialized");
        return {
          info: (async function* () {
            yield { raw: "info" } as IBaseSearchInfo;
          })(),
          result: Promise.resolve({ raw: "result" } as IBaseSearchResult),
          stop: vi.fn(),
        };
      }),
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onProgress: vi.fn().mockReturnValue(() => {}),
      onTelemetry: vi.fn().mockReturnValue(() => {}),
      onInfo: vi.fn().mockReturnValue(() => {}),
      onSearchResult: vi.fn().mockReturnValue(() => {}),
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
});
