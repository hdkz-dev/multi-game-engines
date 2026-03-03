import { describe, it, expect, vi } from "vitest";
import { BaseAdapter } from "../BaseAdapter.js";
import { WorkerCommunicator } from "../../workers/WorkerCommunicator.js";
import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ILicenseInfo,
  EngineStatus,
} from "../../types.js";

const mockLicense: ILicenseInfo = { name: "MIT", url: "" };

class RobustTestAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  readonly version = "1.0.0";
  readonly engineLicense = mockLicense;
  readonly adapterLicense = mockLicense;
  readonly parser = {
    createSearchCommand: vi.fn().mockReturnValue("go"),
    createStopCommand: vi.fn().mockReturnValue("stop"),
    createOptionCommand: vi.fn().mockReturnValue("setoption"),
    parseInfo: vi.fn(),
    parseResult: vi.fn(),
    isReadyCommand: "isready",
    readyResponse: "readyok",
  };

  constructor(id = "robust-test", name = "Robust Test") {
    super(id, name, {});
  }

  public async load(): Promise<void> {
    this.emitStatusChange("ready");
  }

  protected async onInitialize(): Promise<void> {}
  protected async onSearchRaw(): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async onDispose(): Promise<void> {}
  protected async onBookLoaded(): Promise<void> {}

  public setStatus(status: EngineStatus) {
    this._status = status;
    this.emitStatusChange(status);
  }

  public testHandleIncomingMessage(data: unknown) {
    this.handleIncomingMessage(data);
  }

  public setCommunicator(comm: unknown): void {
    this.communicator = comm as WorkerCommunicator;
  }
}

describe("BaseAdapter: Low-Level Robustness & Stress Tests", () => {
  it("エンジンから巨大なデータや不正なオブジェクトが送られてきても、パース層で安全に破棄されること", async () => {
    const adapter = new RobustTestAdapter();
    adapter.setStatus("ready");

    const hugeData = "info ".repeat(10000);
    expect(() => adapter.testHandleIncomingMessage(hugeData)).not.toThrow();
    expect(() =>
      adapter.testHandleIncomingMessage({ complex: { nested: null } }),
    ).not.toThrow();
  });

  it("メッセージ送信中に communicator が同期的に失敗した場合でも、busy 状態が解除され ready に戻ること", async () => {
    const adapter = new RobustTestAdapter();
    adapter.setStatus("ready");

    // ダミーの communicator をセット
    adapter.setCommunicator({
      postMessage: () => {
        throw new Error("Network split");
      },
      onMessage: vi.fn(),
      terminate: vi.fn(),
    });

    expect(() => adapter.searchRaw("go")).toThrow("Network split");
    expect(adapter.status).toBe("ready");
  });

  it("AsyncGenerator でのメッセージ受信中、エンジンが error 状態に遷移した場合、イテレータが適切に close されること", async () => {
    const adapter = new RobustTestAdapter();
    adapter.setStatus("ready");
    adapter.setCommunicator({
      postMessage: vi.fn(),
      onMessage: vi.fn(),
      terminate: vi.fn(),
    });

    const task = adapter.searchRaw("go");
    const infoIter = task.info[Symbol.asyncIterator]();

    // 最初の info を送る
    vi.mocked(adapter.parser.parseInfo).mockReturnValue({ raw: "depth 1" });
    adapter.testHandleIncomingMessage("info depth 1");

    const first = await infoIter.next();
    expect(first.value).toEqual({ raw: "depth 1" });

    // エンジンをエラーにする
    adapter.setStatus("error");

    // 次の next() は即座に終了 (done: true) すべき
    const second = await infoIter.next();
    expect(second.done).toBe(true);
  });
});
