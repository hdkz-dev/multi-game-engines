import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import { MockAdapter } from "../../mocks/MockAdapter.js";
import {
  IBaseSearchOptions,
  EngineErrorCode,
} from "../../types.js";

describe("EngineFacade: Advanced Race Conditions & Stress Tests", () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ id: "race-engine" });
    adapter.setCommunicator({ postMessage: vi.fn(), onMessage: vi.fn(), terminate: vi.fn() });
  });

  it("アトミック・ロード: 同時に load() を呼んでも、アダプターの load は一度しか呼ばれないこと", async () => {
    const loadSpy = vi.spyOn(adapter, "load").mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)));
    const facade = new EngineFacade(adapter);

    const p1 = facade.load();
    const p2 = facade.load();
    const p3 = facade.load();

    await Promise.all([p1, p2, p3]);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("探索リクエストが並行して飛んだ際、BUSY エラーで適切に拒否されること", async () => {
    adapter.setStatus("ready");
    const facade = new EngineFacade(adapter);

    // 1回目
    const p1 = facade.search({} as IBaseSearchOptions);
    
    // 2回目: Facade 側の同期ロックにより即座に拒否されるはず
    const p2 = facade.search({} as IBaseSearchOptions);

    await expect(p2).rejects.toThrow(
      expect.objectContaining({ code: EngineErrorCode.NOT_READY }),
    );

    // p1 を終わらせる
    adapter.testHandleIncomingMessage("bestmove e2e4");
    await p1;
  });
});
