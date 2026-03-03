import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import { BaseAdapter } from "../../adapters/BaseAdapter.js";
import {
  IEngineLoader,
} from "../../types.js";

function createMockAdapter(id: string, name = "Mock engine") {
  class MockAdapter extends BaseAdapter {
    readonly version = "1.0.0";
    readonly parser = {
      createSearchCommand: vi.fn().mockReturnValue("go"),
      createStopCommand: vi.fn().mockReturnValue("stop"),
      createOptionCommand: vi.fn().mockReturnValue("setoption"),
      parseInfo: vi.fn(),
      parseResult: vi.fn(),
      isReadyCommand: "isready",
      readyResponse: "readyok",
    };

    constructor() {
      super(id, name, {});
    }

    protected async onInitialize() {}
    protected async onSearchRaw() {}
    protected async onStop() {}
    protected async onDispose() {}
    protected async onBookLoaded() {}
    public async load() {
      this.emitStatusChange("ready");
    }
  }
  return new MockAdapter();
}

describe("EngineFacade", () => {
  let mockLoader: unknown;

  beforeEach(() => {
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue({ main: "blob:url" }),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
  });

  it("should atomic load: concurrent load() calls should be shared", async () => {
    const adapter = createMockAdapter("test");
    const loadSpy = vi.spyOn(adapter, "load").mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)));
    
    const facade = new EngineFacade(adapter, [], () => Promise.resolve(mockLoader));

    const p1 = facade.load();
    const p2 = facade.load();

    await Promise.all([p1, p2]);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("dispose() がアダプターを破棄し、リソースを解放すること", async () => {
    const adapter = createMockAdapter("test");
    vi.spyOn(adapter, "dispose");
    const loaderProvider = vi.fn().mockResolvedValue(mockLoader);
    
    const facade = new EngineFacade(adapter, [], loaderProvider);
    
    await facade.load();
    await facade.dispose();

    expect(adapter.dispose).toHaveBeenCalledTimes(1);
    expect(mockLoader.revokeAll).toHaveBeenCalled();
  });
});
