import { useRef, useCallback, useSyncExternalStore, useEffect } from "react";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  IMiddleware,
} from "@multi-game-engines/core";
import {
  SearchMonitor,
  SearchStateTransformer,
  createInitialState,
  EngineSearchState,
  ExtendedSearchInfo,
  UINormalizerMiddleware,
} from "@multi-game-engines/ui-core";

/**
 * エンジンの思考状況をリアクティブに監視するカスタムフック。
 *
 * 2026 Best Practice:
 * - UINormalizerMiddleware を自動適用し、データの正規化をミドルウェア層へ移譲。
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
    autoMiddleware?: boolean;
  } = {},
) {
  const {
    initialPosition = "startpos",
    transformer = SearchStateTransformer.mergeInfo as unknown as (
      state: T_STATE,
      info: T_INFO,
    ) => T_STATE,
    autoMiddleware = true,
  } = options;

  const monitorRef = useRef<SearchMonitor<
    T_STATE,
    T_OPTIONS,
    T_INFO,
    T_RESULT
  > | null>(null);

  if (!monitorRef.current) {
    if (autoMiddleware && typeof engine.use === "function") {
      // 2026 Best Practice:
      // ミドルウェアによる型変換（unknown -> ExtendedSearchInfo）を明示的にキャストして適用。
      // エンジンインスタンスの T_INFO が ExtendedSearchInfo を継承しているため、この操作は安全。
      const normalizer = new UINormalizerMiddleware<
        T_OPTIONS,
        unknown,
        T_RESULT
      >();

      engine.use(
        normalizer as unknown as IMiddleware<T_OPTIONS, T_INFO, T_RESULT>,
      );
    }

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

  useEffect(() => {
    monitor.startMonitoring();
    return () => {
      monitor.stopMonitoring();
    };
  }, [monitor]);

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
