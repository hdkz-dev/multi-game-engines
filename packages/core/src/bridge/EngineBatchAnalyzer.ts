import { IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IEngine,
  EngineErrorCode, } from "../types.js";
import { EngineError } from "../errors/EngineError.js";

/**
 * 棋譜全体の非同期一括解析を管理するクラス。
 * 優先度制御（割り込み優先）と制御（pause/resume/abort）が可能。
 */
export class EngineBatchAnalyzer<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  private queue: T_OPTIONS[] = [];
  private results: T_RESULT[] = [];
  private isPaused = false;
  private isAborted = false;
  private currentTaskPromise: Promise<T_RESULT> | null = null;
  private runPromise: Promise<T_RESULT[]> | null = null;
  private currentIndex = 0;

  constructor(private engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>) {}

  /**
   * 解析キューに局面を追加します。
   */
  public add(options: T_OPTIONS): void {
    this.queue.push(options);
  }

  /**
   * キューにある全ての局面の解析を開始します。
   */
  public async analyzeAll(
    onProgress?: (index: number, total: number, result: T_RESULT) => void,
  ): Promise<T_RESULT[]> {
    if (this.runPromise) return this.runPromise;

    this.runPromise = (async () => {
      this.isAborted = false;

      while (this.currentIndex < this.queue.length && !this.isAborted) {
        if (this.isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        const options = this.queue[this.currentIndex]!;
        try {
          this.currentTaskPromise = this.engine.search(options);
          const result = await this.currentTaskPromise;
          this.results[this.currentIndex] = result;

          onProgress?.(this.currentIndex + 1, this.queue.length, result);
          this.currentIndex++;
        } catch (err) {
          if (
            err instanceof EngineError &&
            err.code === EngineErrorCode.CANCELLED
          ) {
            // Pause or Abort during search
            if (this.isAborted) break;
            if (this.isPaused) continue;
            throw err;
          }
          throw err;
        } finally {
          this.currentTaskPromise = null;
        }
      }

      return [...this.results];
    })();

    try {
      return await this.runPromise;
    } finally {
      this.runPromise = null;
    }
  }

  /**
   * 解析を一時停止します。
   */
  public pause(): void {
    this.isPaused = true;
    this.engine.stop();
  }

  /**
   * 解析を再開します。
   */
  public resume(): void {
    this.isPaused = false;
  }

  /**
   * 解析を中止します。
   */
  public abort(): void {
    this.isAborted = true;
    this.engine.stop();
  }

  /**
   * 特定の局面を最優先（割り込み）で解析します。
   * 現在進行中のバッチ処理は一時停止されます。
   */
  public async analyzePriority(options: T_OPTIONS): Promise<T_RESULT> {
    const wasPaused = this.isPaused;
    this.pause();

    try {
      // 進行中のタスクが止まるのを待つ
      if (this.currentTaskPromise) {
        try {
          await this.currentTaskPromise;
        } catch (err) {
          if (
            !(
              err instanceof EngineError &&
              err.code === EngineErrorCode.CANCELLED
            )
          ) {
            throw err;
          }
        }
      }
      return await this.engine.search(options);
    } finally {
      if (!wasPaused) this.resume();
    }
  }

  public get progress(): { current: number; total: number } {
    return { current: this.currentIndex, total: this.queue.length };
  }
}
