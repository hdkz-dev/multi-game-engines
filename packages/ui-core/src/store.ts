import {
  EngineStatus,
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";

/**
 * 購読解除用の関数
 */
export type Unsubscribe = () => void;

/**
 * ストアの通知を間引くための設定
 */
export interface StoreOptions {
  throttleMs?: number;
}

/**
 * フレームワーク非依存のリアクティブ・ストア。
 */
export class EngineStore<
  T_STATE,
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  private state: T_STATE;
  private listeners: Set<() => void> = new Set();
  private pendingUpdate = false;
  private throttleTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>,
    initialState: T_STATE,
    private readonly options: StoreOptions = { throttleMs: 0 },
  ) {
    this.state = initialState;
  }

  /**
   * 現在の状態を取得 (読み取り専用)
   */
  getState = (): T_STATE => {
    return this.state;
  };

  /**
   * 状態を更新。
   */
  setState(updater: (state: T_STATE) => T_STATE): void {
    this.state = updater(this.state);
    this.scheduleNotify();
  }

  /**
   * 変更通知の購読。
   */
  subscribe = (listener: () => void): Unsubscribe => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private scheduleNotify(): void {
    if (this.pendingUpdate) return;
    this.pendingUpdate = true;

    if (this.options.throttleMs && this.options.throttleMs > 0) {
      if (this.throttleTimeout) return;
      this.throttleTimeout = setTimeout(() => {
        this.throttleTimeout = null;
        this.notify();
      }, this.options.throttleMs);
    } else {
      // 2026 Best Practice: SSR (Node.js) 環境を考慮した安全なスケジューリング
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => this.notify());
      } else {
        // Node.js 等の非ブラウザ環境用フォールバック
        queueMicrotask(() => this.notify());
      }
    }
  }

  private notify(): void {
    this.pendingUpdate = false;
    this.listeners.forEach((l) => l());
  }

  getEngine(): IEngine<T_OPTIONS, T_INFO, T_RESULT> {
    return this.engine;
  }
  getStatus(): EngineStatus {
    return this.engine.status;
  }
}
