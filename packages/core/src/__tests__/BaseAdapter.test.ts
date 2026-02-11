import { describe, it, expect, vi } from "vitest";
import { BaseAdapter } from "../adapters/BaseAdapter";
import { 
  IProtocolParser, 
  ILoadProgress, 
  IBaseSearchOptions, 
  IBaseSearchInfo, 
  IBaseSearchResult, 
  ISearchTask, 
  Move 
} from "../types";

/**
 * 抽象クラス BaseAdapter の基底機能をテストするための具象クラス。
 */
class TestAdapter extends BaseAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> {
  readonly id = "test";
  readonly name = "Test";
  readonly version = "1.0";
  readonly engineLicense = { name: "MIT", url: "" };
  readonly adapterLicense = { name: "MIT", url: "" };
  readonly sources = {};
  
  /** プロトコルパーサーの最小限のモック */
  readonly parser: IProtocolParser<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> = {
    createSearchCommand: vi.fn(),
    createStopCommand: vi.fn(),
    parseInfo: vi.fn(),
    parseResult: vi.fn(),
  };

  async load() {
    this.emitStatusChange("ready");
  }
  
  /** 最小限の検索タスクを返却 */
  searchRaw(): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    return {
      info: (async function* () {})(),
      result: Promise.resolve({ bestMove: "" as Move }),
      stop: async () => {},
    };
  }
  
  async dispose() {}

  /** テスト用にプロテクトメソッドを公開 */
  public triggerProgress(progress: ILoadProgress) {
    this.emitProgress(progress);
  }
}

describe("BaseAdapter (Foundation)", () => {
  it("should sync initial status to new subscribers and handle updates", async () => {
    const adapter = new TestAdapter();
    const listener = vi.fn();
    
    // 1. 購読時に初期ステータス（idle）が即座に通知されることを確認
    adapter.onStatusChange(listener);
    expect(listener).toHaveBeenCalledWith("idle");

    // 2. 状態遷移後に通知されることを確認
    await adapter.load();
    expect(listener).toHaveBeenCalledWith("ready");
    expect(adapter.status).toBe("ready");
  });

  it("should handle progress streaming to listeners", () => {
    const adapter = new TestAdapter();
    const listener = vi.fn();
    
    adapter.onProgress(listener);
    const progress: ILoadProgress = {
      phase: "downloading",
      percentage: 50,
      i18n: { key: "test", defaultMessage: "Loading" }
    };
    
    // アダプター内部からの進捗更新をシミュレート
    adapter.triggerProgress(progress);
    expect(listener).toHaveBeenCalledWith(progress);
  });
});
