import {
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  IBaseSearchInfo,
} from "@multi-game-engines/core";
import { SearchMonitor } from "./monitor.js";

/**
 * UI からのコマンド実行を管理し、楽観的な状態更新と
 * 失敗時のロールバックを制御するディスパッチャー。
 */
export class CommandDispatcher<
  T_STATE,
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  constructor(
    private readonly monitor: SearchMonitor<
      T_STATE,
      T_OPTIONS,
      T_INFO,
      T_RESULT
    >,
    private readonly updateStatus: (status: EngineStatus) => void,
  ) {}

  /**
   * 探索を開始する (楽観的更新付き)
   */
  async dispatchSearch(options: T_OPTIONS): Promise<T_RESULT> {
    const previousStatus = this.monitor.getStatus();

    try {
      // 1. 楽観的に状態を遷移
      this.updateStatus("busy");

      const result = await this.monitor.search(options);

      // 2. 根本修正: 成功時にも状態を確定させる
      this.updateStatus("ready");

      return result;
    } catch (error: unknown) {
      // 3. 根本修正: エラー変数を unknown として扱い安全にロールバック
      console.error("[CommandDispatcher] Search failed:", error);
      this.updateStatus(previousStatus);
      throw error;
    }
  }

  /**
   * 探索を停止する
   */
  async dispatchStop(): Promise<void> {
    try {
      await this.monitor.stop();
      this.updateStatus("ready");
    } catch (error: unknown) {
      console.error("[CommandDispatcher] Failed to stop engine:", error);
      throw error;
    }
  }
}
