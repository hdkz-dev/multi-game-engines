import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseAdapter } from "../BaseAdapter.js";
import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineStatus,
} from "../../types.js";

class RobustTestAdapter extends BaseAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> {
  readonly id = "robust-engine";
  readonly name = "Robust Engine";
  readonly version = "1.0.0";
  readonly parser = {
    createSearchCommand: vi.fn(),
    createStopCommand: vi.fn(),
    createOptionCommand: vi.fn(),
    parseInfo: vi.fn(),
    parseResult: vi.fn(),
    isReadyCommand: "isready",
    readyResponse: "readyok",
  };

  public async load(): Promise<void> { this.emitStatusChange("ready"); }
  protected async onInitialize(): Promise<void> {}
  protected async onSearchRaw(): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async onDispose(): Promise<void> {}
  protected async onBookLoaded(): Promise<void> {}

  public triggerIncoming(data: unknown) { this.handleIncomingMessage(data); }
  public setStatus(s: EngineStatus) { this._status = s; }
  public setCommunicator(c: any) { this.communicator = c; }
}

describe("BaseAdapter: Low-Level Robustness & Stress Tests", () => {
  it("エンジンから巨大なデータや不正なオブジェクトが送られてきても、パース層で安全に破棄されること", () => {
    const adapter = new RobustTestAdapter();
    const infoSpy = vi.fn();
    adapter.onInfo(infoSpy);

    // 巨大なデータや不正な型を投げ込む
    adapter.triggerIncoming("A".repeat(1024 * 1024)); // 1MB message
    adapter.triggerIncoming({ unexpected: "object" });
    adapter.triggerIncoming(null);
    adapter.triggerIncoming(new Uint8Array([0xFF, 0x00, 0xAA]));

    expect(infoSpy).not.toHaveBeenCalled(); // 解析不能なためスルーされるべき
  });

  it("メッセージ送信中に communicator が同期的に失敗した場合でも、busy 状態が解除され ready に戻ること", async () => {
    const adapter = new RobustTestAdapter();
    adapter.setStatus("ready");
    
    const brokenComm = {
      postMessage: vi.fn().mockImplementation(() => { throw new Error("Worker Crashed"); }),
      onMessage: vi.fn().mockReturnValue(() => {}),
      terminate: vi.fn()
    };
    adapter.setCommunicator(brokenComm);

    // searchRaw の内部で送信が試みられる
    expect(() => adapter.searchRaw("go")).toThrow("Worker Crashed");
    
    // エラー後、ステータスが ready にロールバックされているか (busy のままハングしないか)
    // ※ 現在の BaseAdapter にはこのロールバックが不足している可能性があるため、テストで実証・修正する
    expect(adapter.status).toBe("ready");
  });

  it("AsyncGenerator でのメッセージ受信中、エンジンが error 状態に遷移した場合、イテレータが適切に close されること", async () => {
    const adapter = new RobustTestAdapter();
    adapter.setStatus("ready");
    adapter.setCommunicator({ postMessage: vi.fn(), onMessage: vi.fn() });

    const task = adapter.searchRaw("go");
    const iterator = task.info[Symbol.asyncIterator]();
    
    // エンジンエラーを発生させる
    adapter.setStatus("error");
    
    // 次のメッセージ待機がタイムアウトせずに終了するか
    const result = await iterator.next();
    expect(result.done).toBe(true);
  });
});
