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
 * BaseAdapter の共通機能を検証するためのテストクラス。
 * 抽象クラスである BaseAdapter を継承し、内部メソッドをテスト用に公開します。
 */
class TestAdapter extends BaseAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> {
  readonly id = "test-engine";
  readonly name = "Test Engine";
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

  /** 内部メソッド emitStatusChange をテスト用に公開 */
  public setStatus(status: EngineStatus) {
    this.emitStatusChange(status);
  }

  /** 内部メソッド emitProgress をテスト用に公開 */
  public setProgress(progress: ILoadProgress) {
    this.emitProgress(progress);
  }
}

describe("BaseAdapter (Foundation)", () => {
  it("ステータスの購読と遷移が正しく動作すること", () => {
    const adapter = new TestAdapter();
    const listener = vi.fn();

    // 1. 初期ステータスが 'uninitialized' であることを確認
    expect(adapter.status).toBe("uninitialized");

    // 2. ステータス変更を購読
    adapter.onStatusChange(listener);
    
    // 3. 遷移後に通知が来ること、および status プロパティが更新されることを確認
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

    // 検証: 進捗データがリスナーに渡り、内部状態も更新されていること
    expect(listener).toHaveBeenCalledWith(mockProgress);
    expect(adapter.progress).toEqual(mockProgress);
  });
});
