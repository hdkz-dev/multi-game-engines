import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  createPositionString,
} from "@multi-game-engines/core";
import { SearchMonitor } from "./monitor.js";
import { createInitialState, EngineSearchState } from "./types.js";

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
    // 2026 Best Practice: 抽象インターフェースへのキャスト。
    // IEngine は共変的に扱えるプロパティのみを持つため、IBase へのキャストは安全。
    const abstractEngine = engine as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const entry = this.monitors.get(abstractEngine);

    if (entry) {
      // 内部ストレージからは EngineSearchState (ベース型) で返るため、
      // 呼び出し側の要求する具体的なサブタイプにキャストして返却する。
      // SearchMonitor は T_STATE に対して不変 (invariant) であるが、
      // レジストリが作成時の transformer との一貫性を保証するため、論理的に安全。
      return entry.monitor as unknown as SearchMonitor<
        T_STATE,
        T_OPTIONS,
        T_INFO,
        T_RESULT
      >;
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
      // 永続化のためにベース型にキャストして保存。
      // SearchMonitor は不変 (invariant) だが、
      // 内部管理用の WeakMap においては具象型を抽象型として扱う。
      monitor: newMonitor as unknown as SearchMonitor<
        EngineSearchState,
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
