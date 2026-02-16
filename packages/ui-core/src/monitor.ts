import {
  EngineStatus,
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { EngineStore, Unsubscribe } from "./store.js";
import { SubscriptionManager } from "./SubscriptionManager.js";

/**
 * エンジン解析を監視・制御するための高レベルモニター。
 */
export class SearchMonitor<
  T_STATE,
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  private readonly store: EngineStore<T_STATE, T_OPTIONS, T_INFO, T_RESULT>;
  private readonly subManager = new SubscriptionManager();

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
          this.store.setState((state) => this.transformer(state, info));
        }),
      );
    }
    this.refCount++;
  }

  stopMonitoring(): void {
    this.refCount--;
    if (this.refCount <= 0) {
      this.refCount = 0;
      this.subManager.clear();
      this.store.dispose();
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
    return this.engine.stop();
  }
  getState(): T_STATE {
    return this.store.getState();
  }
  getStatus(): EngineStatus {
    return this.engine.status;
  }
}
