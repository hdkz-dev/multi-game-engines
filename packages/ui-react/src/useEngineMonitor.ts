import { useRef, useCallback, useSyncExternalStore, useEffect } from "react";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import {
  SearchMonitor,
  SearchStateTransformer,
  createInitialState,
  EngineSearchState,
  ExtendedSearchInfo,
} from "@multi-game-engines/ui-core";

/**
 * エンジンの思考状況をリアクティブに監視するカスタムフック。
 *
 * 2026 Best Practice:
 * - useSyncExternalStore による Concurrent Rendering 対応。
 * - useRef + useEffect によるリークのない厳格な購読管理。
 */
export function useEngineMonitor<
  T_STATE = EngineSearchState,
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends ExtendedSearchInfo = ExtendedSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
>(
  engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>,
  options: {
    initialPosition?: string;
    transformer?: (state: T_STATE, info: T_INFO) => T_STATE;
  } = {},
) {
  const {
    initialPosition = "startpos",
    transformer = SearchStateTransformer.mergeInfo as unknown as (
      state: T_STATE,
      info: T_INFO,
    ) => T_STATE,
  } = options;

  // モニターインスタンスを ref で管理し、ライフサイクル中一つだけ存在することを保証。
  // 注意: 初期化は lazy initialization パターンを使用
  const monitorRef = useRef<SearchMonitor<
    T_STATE,
    T_OPTIONS,
    T_INFO,
    T_RESULT
  > | null>(null);

  if (!monitorRef.current) {
    monitorRef.current = new SearchMonitor<
      T_STATE,
      T_OPTIONS,
      T_INFO,
      T_RESULT
    >(
      engine,
      createInitialState(initialPosition) as unknown as T_STATE,
      transformer,
    );
  }

  const monitor = monitorRef.current;

  // 購読のライフサイクル管理
  useEffect(() => {
    monitor.startMonitoring();
    return () => {
      monitor.stopMonitoring();
    };
  }, [monitor]);

  // 最新の状態を同期
  const state = useSyncExternalStore(
    monitor.subscribe,
    monitor.getSnapshot,
    monitor.getSnapshot,
  );

  const search = useCallback(
    (searchOptions: T_OPTIONS) => monitor.search(searchOptions),
    [monitor],
  );
  const stop = useCallback(() => monitor.stop(), [monitor]);

  return {
    state,
    status: engine.status,
    search,
    stop,
    monitor,
  };
}
