import {
  EngineStatus,
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { EngineStore, Unsubscribe } from "../state/store.js";
import { SubscriptionManager } from "../state/SubscriptionManager.js";

/**
 * エンジン解析を監視・制御するための高レベルモニター。
 * 2026 Best Practice: requestAnimationFrame によるスロットリングを導入し、
 * 高頻度な info 出力時でも UI スレッドのブロックを防ぐ。
 */
export class SearchMonitor<
  T_STATE,
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  private readonly store: EngineStore<T_STATE, T_OPTIONS, T_INFO, T_RESULT>;
  private readonly subManager = new SubscriptionManager();
  private pendingUpdates: T_INFO[] = [];
  private updateTimerId: number | NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>,
    initialState: T_STATE,
    private readonly transformer: (state: T_STATE, info: T_INFO) => T_STATE,
  ) {
    this.store = new EngineStore(engine, initialState);
  }

  private refCount = 0;

  startMonitoring(): void {
    if (this.refCount === 0) {
      this.subManager.clear();
      this.subManager.add(
        this.engine.onInfo((info) => {
          this.queueUpdate(info);
        }),
      );
    }
    this.refCount++;
  }

  private queueUpdate(info: T_INFO) {
    // バッファサイズ制限: UI更新が追いつかない場合の安全策 (最大1000件保持し、古いものは捨てる)
    // 通常 reduce 処理されるためここが溢れることは稀だが、異常時の保護として重要。
    if (this.pendingUpdates.length >= 1000) {
      this.pendingUpdates.shift();
    }
    this.pendingUpdates.push(info);

    if (!this.isProcessing) {
      this.isProcessing = true;
      if (typeof requestAnimationFrame !== "undefined") {
        this.updateTimerId = requestAnimationFrame(() => this.processUpdates());
      } else {
        // Fallback for Node.js environment (tests)
        this.updateTimerId = setTimeout(() => this.processUpdates(), 0);
      }
    }
  }

  private processUpdates() {
    if (this.pendingUpdates.length === 0) {
      this.isProcessing = false;
      return;
    }

    try {
      // バッチ処理: 溜まっている全ての更新を適用
      const updates = [...this.pendingUpdates];
      this.pendingUpdates = [];

      this.store.setState((currentState) => {
        return updates.reduce(
          (state, info) => this.transformer(state, info),
          currentState,
        );
      });
    } finally {
      this.isProcessing = false;
      this.updateTimerId = null;
    }
  }

  stopMonitoring(): void {
    this.refCount--;
    if (this.refCount <= 0) {
      this.refCount = 0;
      this.subManager.clear();
      this.store.dispose();

      if (this.updateTimerId !== null) {
        if (
          typeof this.updateTimerId === "number" &&
          typeof cancelAnimationFrame !== "undefined"
        ) {
          cancelAnimationFrame(this.updateTimerId);
        } else {
          // Fallback or Node.js
          clearTimeout(this.updateTimerId as number | NodeJS.Timeout);
        }
        this.updateTimerId = null;
      }
      this.pendingUpdates = [];
      this.isProcessing = false;
    }
  }

  /**
   * 外部ストア購読。
   */
  subscribe = (listener: () => void): Unsubscribe => {
    return this.store.subscribe(listener);
  };

  /**
   * スナップショット取得。
   */
  getSnapshot = (): T_STATE => {
    return this.store.getState();
  };

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    return this.engine.search(options);
  }
  async stop(): Promise<void> {
    this.stopMonitoring();
    return this.engine.stop();
  }
  getState(): T_STATE {
    return this.store.getState();
  }
  getStatus(): EngineStatus {
    return this.engine.status;
  }
}
