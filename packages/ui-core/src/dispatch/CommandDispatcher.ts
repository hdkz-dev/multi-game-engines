import { IBaseSearchOptions, IBaseSearchResult, EngineStatus, IBaseSearchInfo } from "@multi-game-engines/core";
import { SearchMonitor } from "../monitor/monitor.js";

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
      this.updateStatus("busy");
      const result = await this.monitor.search(options);

      // 成功時は実状態（または待機状態）へ確定
      this.updateStatus("ready");
      return result;
    } catch (error: unknown) {
      console.error("[CommandDispatcher] Search failed:", error);
      this.updateStatus(previousStatus);
      throw error;
    }
  }

  /**
   * 探索を停止する
   *
   * 2026 Zenith Practice:
   * 停止処理自体が失敗するエッジケースも考慮し、
   * 常に以前の状態への復帰経路を確保。
   */
  async dispatchStop(): Promise<void> {
    const previousStatus = this.monitor.getStatus();

    try {
      await this.monitor.stop();
      this.updateStatus("ready");
    } catch (error: unknown) {
      console.error("[CommandDispatcher] Failed to stop engine:", error);
      // 停止失敗時は元の状態（恐らく busy）に戻す
      this.updateStatus(previousStatus);
      throw error;
    }
  }
}
