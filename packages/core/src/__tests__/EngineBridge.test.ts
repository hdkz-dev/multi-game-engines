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
});
