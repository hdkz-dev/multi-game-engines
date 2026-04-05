import {
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  IBaseSearchInfo,
} from "@multi-game-engines/core";
import { SearchMonitor } from "../monitor/monitor.js";

declare global {
  interface Window {
    __LAST_ERROR__?: string | null;
  }
}
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
  /**
   * CommandDispatcher を初期化します。
   * @param monitor - エンジンの状態を監視するモニターインスタンス。
   * @param updateStatus - UI 状態を更新するためのコールバック関数。
   */
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
   * 探索を開始します。
   * 実行前に window.__LAST_ERROR__ をリセットし、実行中のエラーをキャッチして記録します。
   * @param options - 探索オプション。
   * @returns 探索結果の Promise。
   */
  async dispatchSearch(options: T_OPTIONS): Promise<T_RESULT> {
    const previousStatus = this.monitor.getStatus();

    try {
      if (typeof window !== "undefined") {
        window.__LAST_ERROR__ = null;
      }
      // console.log("[CommandDispatcher] Starting search with options:", JSON.stringify(options));
      this.updateStatus("busy");
      const result = await this.monitor.search(options);

      // console.log("[CommandDispatcher] Search finished successfully");
      // 成功時は実状態（または待機状態）へ確定
      this.updateStatus("ready");
      return result;
    } catch (error: unknown) {
      console.error("[CommandDispatcher] Search failed:", error);
      if (typeof window !== "undefined") {
        window.__LAST_ERROR__ =
          error instanceof Error ? error.message : String(error);
      }
      this.updateStatus(previousStatus);
      throw error;
    }
  }

  /**
   * 探索を停止します。
   * 停止処理自体が失敗した場合でも、以前の状態への復帰を試みます。
   * @returns 停止処理の Promise。
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
