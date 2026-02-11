import { describe, it, expect, vi } from "vitest";
import { BaseAdapter } from "../adapters/BaseAdapter";
import { 
  IBaseSearchOptions, 
  IBaseSearchInfo, 
  IBaseSearchResult, 
  ISearchTask, 
  EngineStatus, 
  ILoadProgress,
  Move
} from "../types";

/**
 * BaseAdapter の共通機能を検証するための具象テストクラス。
 */
class TestAdapter extends BaseAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> {
  readonly id = "test-engine";
  readonly name = "Test Engine";
  readonly version = "1.0.0";
  readonly engineLicense = { name: "MIT", url: "" };
  readonly adapterLicense = { name: "MIT", url: "" };
  readonly sources = {};
  
  // パーサーのモック
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

  /** 
   * テスト用ヘルパーメソッド。
   * 基底クラスの内部メソッドを安全に呼び出すためのラッパー。
   */
  public setStatus(status: EngineStatus) {
    this.emitStatusChange(status);
  }

  public setProgress(progress: ILoadProgress) {
    this.emitProgress(progress);
  }
}

describe("BaseAdapter (Foundation)", () => {
  it("ステータスの購読と遷移が正しく動作すること", () => {
    const adapter = new TestAdapter();
    const listener = vi.fn();

    // 1. 購読時に現在のステータスが取得できることを確認
    expect(adapter.status).toBe("uninitialized");

    // 2. 購読開始
    adapter.onStatusChange(listener);
    
    // 3. 状態遷移後に通知されることを確認
    adapter.setStatus("ready");
    expect(listener).toHaveBeenCalledWith("ready");
    expect(adapter.status).toBe("ready");
  });

  it("進捗状況のストリーミングが正しく動作すること", () => {
    const adapter = new TestAdapter();
    const listener = vi.fn();

    adapter.onProgress(listener);
    
    const mockProgress: ILoadProgress = { 
      phase: "downloading", 
      percentage: 50,
      i18n: { key: "test", defaultMessage: "Testing" }
    };
    adapter.setProgress(mockProgress);

    expect(listener).toHaveBeenCalledWith(mockProgress);
    expect(adapter.progress).toEqual(mockProgress);
  });
});
