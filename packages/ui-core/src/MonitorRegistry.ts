import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { SearchMonitor } from "./monitor.js";
import {
  createInitialState,
  EngineSearchState,
  PositionString,
} from "./types.js";

/**
 * モニターのエントリを型安全に管理するための内部インターフェース。
 */
interface MonitorEntry<
  T_STATE,
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  monitor: SearchMonitor<T_STATE, T_OPTIONS, T_INFO, T_RESULT>;
  readonly typeTag: symbol;
}

/**
 * エンジンインスタンスとモニターを一対一で管理するレジストリ。
 */
export class MonitorRegistry {
  private static instance: MonitorRegistry;

  /**
   * 2026 Best Practice: any を排除し、最も抽象的な IBase 型でエントリを管理。
   */
  private monitors = new WeakMap<
    IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>,
    MonitorEntry<
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
   * テスト用: レジストリをリセットします。
   */
  static reset(): void {
    MonitorRegistry.instance = new MonitorRegistry();
  }

  /**
   * エンジンに対応するモニターを取得、または新規作成する。
   */
  getOrCreateMonitor<
    T_STATE extends EngineSearchState = EngineSearchState,
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(
    engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>,
    initialPosition: string,
    transformer: (state: T_STATE, info: T_INFO) => T_STATE,
  ): SearchMonitor<T_STATE, T_OPTIONS, T_INFO, T_RESULT> {
    if (!engine) {
      throw new Error("[MonitorRegistry] Engine instance is required.");
    }
    const abstractEngine = engine as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const entry = this.monitors.get(abstractEngine);

    if (entry) {
      return entry.monitor as unknown as SearchMonitor<
        T_STATE,
        T_OPTIONS,
        T_INFO,
        T_RESULT
      >;
    }

    const brandedPosition = initialPosition as unknown as PositionString;

    const newMonitor = new SearchMonitor<T_STATE, T_OPTIONS, T_INFO, T_RESULT>(
      engine,
      createInitialState(brandedPosition) as unknown as T_STATE,
      transformer,
    );

    const newEntry: MonitorEntry<
      unknown,
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    > = {
      monitor: newMonitor as unknown as SearchMonitor<
        unknown,
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
      typeTag: Symbol("MonitorTypeTag"),
    };

    this.monitors.set(abstractEngine, newEntry);

    return newMonitor;
  }
}
