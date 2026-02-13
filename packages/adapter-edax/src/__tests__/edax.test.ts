import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EdaxAdapter } from "../edax.js";
import { IEngineLoader, EngineStatus } from "@multi-game-engines/core";
import { Move, IOthelloSearchInfo } from "../EdaxParser.js";

describe("EdaxAdapter", () => {
  let currentMockWorker: MockWorker | null = null;

  class MockWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage: ((ev: { data: unknown }) => void) | null = null;
    constructor() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      currentMockWorker = this;
    }
  }

  beforeEach(() => {
    currentMockWorker = null;
    vi.stubGlobal("Worker", MockWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockLoader: IEngineLoader = {
    loadResource: vi.fn().mockResolvedValue("blob://edax"),
    loadResources: vi.fn().mockResolvedValue({ main: "blob://edax" }),
    revoke: vi.fn(),
  };

  it("独自プロトコルの起動シーケンスを完了できること", async () => {
    const adapter = new EdaxAdapter();
    const loadPromise = adapter.load(mockLoader);

    await vi.waitFor(() => expect(currentMockWorker).not.toBeNull());
    // バージョン情報を含む応答をシミュレート
    currentMockWorker!.onmessage!({ data: "Edax 4.4.0" });

    await loadPromise;
    expect(adapter.status).toBe("ready" as EngineStatus);
  });

  it("思考状況のパース結果をストリームで受け取れること", async () => {
    const adapter = new EdaxAdapter();
    const loadPromise = adapter.load(mockLoader);
    await vi.waitFor(() => expect(currentMockWorker).not.toBeNull());
    currentMockWorker!.onmessage!({ data: "Edax 4.4.0" });
    await loadPromise;
    
    const task = adapter.searchRaw("go 20");
    const infoResults: IOthelloSearchInfo[] = [];
    
    const readInfo = async () => {
      for await (const info of task.info) {
        infoResults.push(info);
      }
    };
    const readPromise = readInfo();

    // 思考状況の送信
    currentMockWorker!.onmessage!({ data: "Depth: 10  Mid: +5  move: c3" });
    // 最終結果の送信
    currentMockWorker!.onmessage!({ data: "= c3" });

    await readPromise;
    expect(infoResults[0].score).toBe(5);
    expect(infoResults[0].pv).toEqual(["c3"]);
    
    const result = await task.result;
    expect(result.bestMove).toBe("c3" as Move);
  });
});
