import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import { MockAdapter } from "../../mocks/MockAdapter.js";

describe("EngineFacade", () => {
  let mockLoader: any;

  beforeEach(() => {
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:url"),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
  });

  it("should atomic load: concurrent load() calls should be shared", async () => {
    const adapter = new MockAdapter({ id: "test" });
    const loadSpy = vi.spyOn(adapter, "load").mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)));
    const facade = new EngineFacade(adapter, [], async () => mockLoader);

    const p1 = facade.load();
    const p2 = facade.load();

    await Promise.all([p1, p2]);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("dispose() がアダプターを破棄し、リソースを解放すること", async () => {
    const adapter = new MockAdapter({ id: "test-engine" });
    const facade = new EngineFacade(adapter, [], async () => mockLoader);

    vi.spyOn(adapter, "dispose");

    await facade.dispose();

    expect(adapter.dispose).toHaveBeenCalledTimes(1);
    expect(mockLoader.revokeAll).toHaveBeenCalled();
  });
});
