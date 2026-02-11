import { describe, it, expect, vi } from "vitest";
import { EngineBridge } from "../bridge/EngineBridge";
import { BaseAdapter } from "../adapters/BaseAdapter";
import { 
  IBaseSearchOptions, 
  IBaseSearchInfo, 
  IBaseSearchResult, 
  ISearchTask,
  EngineStatus,
  FEN
} from "../types";

/**
 * テスト用のモックアダプター。
 * protected メソッドを公開し、内部状態の変化をシミュレート可能にします。
 */
class MockAdapter extends BaseAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> {
  readonly id = "mock-engine";
  readonly name = "Mock Engine";
  readonly version = "1.0.0";
  readonly engineLicense = { name: "MIT", url: "" };
  readonly adapterLicense = { name: "MIT", url: "" };
  readonly sources = {};

  readonly parser = {
    parseInfo: vi.fn(),
    parseResult: vi.fn(),
    createSearchCommand: vi.fn().mockReturnValue("go"),
    createStopCommand: vi.fn().mockReturnValue("stop"),
  };

  async load() {}
  
  searchRaw(_command: string | string[] | Uint8Array): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    return {
      info: (async function* () {
        yield { depth: 1, score: 10 } as IBaseSearchInfo;
      })(),
      result: Promise.resolve({ bestMove: "e2e4" } as IBaseSearchResult),
      stop: async () => {},
    };
  }
  async dispose() {}

  /** 内部イベントの発火を外部から制御するためのテストヘルパー */
  public testEmitStatusChange(status: EngineStatus) {
    this.emitStatusChange(status);
  }
}

describe("EngineBridge", () => {
  it("アダプター登録時にグローバルなステータス変化が伝播されること", () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter();
    const statusSpy = vi.fn();

    // 購読開始
    const unsubscribe = bridge.onGlobalStatusChange(statusSpy);

    bridge.registerAdapter(adapter);
    
    // アダプター内部での状態変化をシミュレート
    adapter.testEmitStatusChange("ready");

    expect(statusSpy).toHaveBeenCalledWith("mock-engine", "ready");

    // 購読解除のテスト
    unsubscribe();
    adapter.testEmitStatusChange("busy");
    expect(statusSpy).toHaveBeenCalledTimes(1); // 解除後は呼ばれない
  });

  it("ミドルウェアが正しく Facade を通じて実行されること", async () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter();
    
    // コマンドを加工するミドルウェア
    const middleware = {
      onCommand: vi.fn().mockImplementation((cmd) => `modified_${cmd}`),
    };

    bridge.registerAdapter(adapter);
    bridge.use(middleware);

    const engine = bridge.getEngine("mock-engine");
    
    const options: IBaseSearchOptions = { fen: "startpos" as FEN }; 
    await engine.search(options);

    // ミドルウェアが呼ばれ、引数が渡されていることを確認
    expect(middleware.onCommand).toHaveBeenCalled();
  });
});
