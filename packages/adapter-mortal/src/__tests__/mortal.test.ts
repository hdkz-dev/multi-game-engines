import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MortalAdapter } from "../mortal.js";
import { IEngineLoader, EngineStatus, MahjongTile, Move, IMahjongSearchOptions, IMahjongSearchInfo } from "@multi-game-engines/core";

describe("MortalAdapter", () => {
  let currentMockWorker: MockWorker | null = null;

  class MockWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage: ((ev: { data: unknown }) => void) | null = null;
    constructor() {
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
    loadResource: vi.fn().mockResolvedValue("blob://mortal"),
    loadResources: vi.fn().mockResolvedValue({ main: "blob://mortal" }),
    revoke: vi.fn(),
  };

  it("JSON ベースの起動シーケンスを完了できること", async () => {
    const adapter = new MortalAdapter();
    const loadPromise = adapter.load(mockLoader);

    await vi.waitFor(() => expect(currentMockWorker).not.toBeNull());
    // Mortal 形式の ready メッセージ
    currentMockWorker!.onmessage!({ data: { type: "ready" } });

    await loadPromise;
    expect(adapter.status).toBe("ready" as EngineStatus);
  });

  it("思考状況を JSON で受け取り、AsyncIterable で配信できること", async () => {
    const adapter = new MortalAdapter();
    const loadPromise = adapter.load(mockLoader);
    await vi.waitFor(() => expect(currentMockWorker).not.toBeNull());
    currentMockWorker!.onmessage!({ data: { type: "ready" } });
    await loadPromise;

    const options: IMahjongSearchOptions = {
      hand: ["1m", "2m", "3m"] as MahjongTile[],
    };
    const command = adapter.parser.createSearchCommand(options);
    const task = adapter.searchRaw(command);

    const infoResults: IMahjongSearchInfo[] = [];
    const readInfo = async () => {
      for await (const info of task.info) {
        infoResults.push(info);
      }
    };
    const readPromise = readInfo();

    // 思考状況 (JSON)
    currentMockWorker!.onmessage!({
      data: {
        type: "info",
        evaluations: [{ move: "1m", ev: 0.9 }]
      }
    });

    // 最終結果 (JSON)
    currentMockWorker!.onmessage!({
      data: {
        type: "result",
        bestMove: "1m"
      }
    });

    await readPromise;
    expect(infoResults[0].evaluations?.[0].move).toBe("1m" as Move);
    
    const result = await task.result;
    expect(result.bestMove).toBe("1m" as Move);
  });
});
