import { describe, it, expect, vi } from "vitest";
import { EngineBridge } from "../bridge/EngineBridge";
import { BaseAdapter } from "../adapters/BaseAdapter";
import { 
  IBaseSearchOptions, 
  IBaseSearchInfo, 
  IBaseSearchResult, 
  ISearchTask,
  EngineStatus,
  FEN,
  Move
} from "../types";

/**
 * テスト用の最小限のアダプター実装。
 * 基底クラス BaseAdapter を継承し、イベント発火を制御します。
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
      result: Promise.resolve({ bestMove: "e2e4" as Move } as IBaseSearchResult),
      stop: async () => {},
    };
  }
  async dispose() {}

  /** 内部メソッド emitStatusChange をテストから制御するためのヘルパー */
  public testEmitStatusChange(status: EngineStatus) {
    this.emitStatusChange(status);
  }

  public testEmitProgress(progress: ILoadProgress) {
    this.emitProgress(progress);
  }

  public testEmitTelemetry(event: ITelemetryEvent) {
    this.emitTelemetry(event);
  }
}

describe("EngineBridge", () => {
  it("アダプター登録時にブリッジがグローバルなステータス変化を転送すること", () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter();
    const statusSpy = vi.fn();

    // グローバル購読を開始
    const unsubscribe = bridge.onGlobalStatusChange(statusSpy);

    bridge.registerAdapter(adapter);
    
    // アダプターの状態遷移をシミュレート
    adapter.testEmitStatusChange("ready");

    expect(statusSpy).toHaveBeenCalledWith("mock-engine", "ready");

    // 購読解除後の動作を確認
    unsubscribe();
    adapter.testEmitStatusChange("busy");
    expect(statusSpy).toHaveBeenCalledTimes(1); 
  });

  it("アダプター登録時にブリッジがグローバルな進捗状況を転送すること", () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter();
    const progressSpy = vi.fn();

    bridge.onGlobalProgress(progressSpy);
    bridge.registerAdapter(adapter);
    
    const progress: ILoadProgress = { phase: "downloading", percentage: 50 };
    adapter.testEmitProgress(progress);

    expect(progressSpy).toHaveBeenCalledWith("mock-engine", progress);
  });

  it("アダプター登録時にブリッジがグローバルなテレメトリを転送すること", () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter();
    const telemetrySpy = vi.fn();

    bridge.onGlobalTelemetry(telemetrySpy);
    bridge.registerAdapter(adapter);
    
    const event: ITelemetryEvent = { event: "test", timestamp: Date.now(), attributes: {} };
    adapter.testEmitTelemetry(event);

    expect(telemetrySpy).toHaveBeenCalledWith("mock-engine", event);
  });

  it("ブリッジに追加されたミドルウェアが生成された Facade に反映されること", async () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter();
    
    // コマンドを文字列として加工するミドルウェア
    const middleware = {
      onCommand: vi.fn().mockImplementation((cmd: string) => `modified_${cmd}`),
    };

    bridge.registerAdapter(adapter);
    bridge.use(middleware);

    const engine = bridge.getEngine("mock-engine");
    
    const options: IBaseSearchOptions = { fen: "startpos" as FEN }; 
    await engine.search(options);

    // ミドルウェアが適切な引数で呼ばれたか確認
    expect(middleware.onCommand).toHaveBeenCalledWith("go", expect.anything());
  });

  it("dispose() を呼び出すと全てのアダプターが破棄されること", async () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter();
    const disposeSpy = vi.spyOn(adapter, "dispose");

    bridge.registerAdapter(adapter);
    await bridge.dispose();

    expect(disposeSpy).toHaveBeenCalled();
  });

  it("unregisterAdapter() を呼び出すとイベントの転送が停止すること", () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter();
    const statusSpy = vi.fn();

    bridge.registerAdapter(adapter);
    bridge.onGlobalStatusChange(statusSpy);
    
    bridge.unregisterAdapter("mock-engine");
    
    adapter.testEmitStatusChange("ready");
    expect(statusSpy).not.toHaveBeenCalled();
  });
});
