import { IEngine, IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult, createPositionString, EngineErrorCode, EngineError, createI18nKey } from "@multi-game-engines/core";
import { SearchMonitor } from "./monitor.js";
import { createInitialState, EngineSearchState } from "../types.js";

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
      EngineSearchState,
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
   * より具体的なキャストを行うためのバリデータ関数。
   */
  private assertMonitorType<
    T_STATE extends EngineSearchState,
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(
    monitor: unknown,
  ): asserts monitor is SearchMonitor<T_STATE, T_OPTIONS, T_INFO, T_RESULT> {
    if (
      !monitor ||
      typeof monitor !== "object" ||
      !("startMonitoring" in monitor) ||
      typeof (monitor as { startMonitoring: unknown }).startMonitoring !==
        "function" ||
      !("stopMonitoring" in monitor) ||
      typeof (monitor as { stopMonitoring: unknown }).stopMonitoring !==
        "function" ||
      !("subscribe" in monitor) ||
      typeof (monitor as { subscribe: unknown }).subscribe !== "function" ||
      !("getSnapshot" in monitor) ||
      typeof (monitor as { getSnapshot: unknown }).getSnapshot !== "function" ||
      !("search" in monitor) ||
      typeof (monitor as { search: unknown }).search !== "function" ||
      !("stop" in monitor) ||
      typeof (monitor as { stop: unknown }).stop !== "function" ||
      !("getState" in monitor) ||
      typeof (monitor as { getState: unknown }).getState !== "function" ||
      !("getStatus" in monitor) ||
      typeof (monitor as { getStatus: unknown }).getStatus !== "function"
    ) {
      throw new EngineError({
        code: EngineErrorCode.INTERNAL_ERROR,
        message: "[MonitorRegistry] Invalid monitor instance.",
        i18nKey: createI18nKey("engine.errors.internalError"),
        i18nParams: { message: "Invalid monitor instance" },
      });
    }
  }

  /**
   * 具象モニターを抽象モニターとして登録するためのバリデータ関数。
   */
  private asAbstractMonitor<
    T_STATE extends EngineSearchState,
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(
    monitor: SearchMonitor<T_STATE, T_OPTIONS, T_INFO, T_RESULT>,
  ): SearchMonitor<
    EngineSearchState,
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  > {
    if (!monitor) {
      throw new EngineError({
        code: EngineErrorCode.INTERNAL_ERROR,
        message: "[MonitorRegistry] Monitor must be defined",
        i18nKey: createI18nKey("engine.errors.internalError"),
        i18nParams: { message: "Monitor undefined" },
      });
    }
    return monitor as unknown as SearchMonitor<
      EngineSearchState,
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
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
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: "[MonitorRegistry] Engine instance is required.",
        i18nKey: createI18nKey("engine.errors.notReady"),
      });
    }
    const abstractEngine = engine as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const entry = this.monitors.get(abstractEngine);

    if (entry) {
      const cachedMonitor = entry.monitor;
      this.assertMonitorType<T_STATE, T_OPTIONS, T_INFO, T_RESULT>(
        cachedMonitor,
      );
      return cachedMonitor;
    }

    const brandedPosition = createPositionString(initialPosition);
    const initialState = createInitialState(brandedPosition) as T_STATE;

    const newMonitor = new SearchMonitor<T_STATE, T_OPTIONS, T_INFO, T_RESULT>(
      engine,
      initialState,
      transformer,
    );

    const newEntry: MonitorEntry<
      EngineSearchState,
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    > = {
      monitor: this.asAbstractMonitor(newMonitor),
      typeTag: Symbol("MonitorTypeTag"),
    };

    this.monitors.set(abstractEngine, newEntry);

    return newMonitor;
  }
}
