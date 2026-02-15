import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { SearchMonitor } from "./monitor.js";
import { createInitialState, EngineSearchState } from "./types.js";

/**
 * エンジンインスタンスとモニターを一対一で管理するレジストリ。
 */
export class MonitorRegistry {
  private static instance: MonitorRegistry;

  /**
   * 内部的には最も抽象的な型で保持。
   * 2026 Best Practice: WeakMap を使用し、GCを妨げない設計にする。
   */
  private monitors = new WeakMap<
    IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>,
    SearchMonitor<
      unknown,
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >
  >();

  private constructor() {}

  static getInstance(): MonitorRegistry {
    if (!MonitorRegistry.instance) {
      MonitorRegistry.instance = new MonitorRegistry();
    }
    return MonitorRegistry.instance;
  }

  /**
   * エンジンに対応するモニターを取得、または新規作成する。
   */
  getOrCreateMonitor<
    T_STATE = EngineSearchState,
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(
    engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>,
    initialPosition: string,
    transformer: (state: T_STATE, info: T_INFO) => T_STATE,
  ): SearchMonitor<T_STATE, T_OPTIONS, T_INFO, T_RESULT> {
    // ジェネリクスの抽象化レベルを合わせて WeakMap にアクセス
    const abstractEngine = engine as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    let monitor = this.monitors.get(abstractEngine);

    if (!monitor) {
      const newMonitor = new SearchMonitor<
        T_STATE,
        T_OPTIONS,
        T_INFO,
        T_RESULT
      >(
        engine,
        createInitialState(initialPosition) as unknown as T_STATE,
        transformer,
      );

      monitor = newMonitor as unknown as SearchMonitor<
        unknown,
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >;
      this.monitors.set(abstractEngine, monitor);
    }

    return monitor as unknown as SearchMonitor<
      T_STATE,
      T_OPTIONS,
      T_INFO,
      T_RESULT
    >;
  }
}
