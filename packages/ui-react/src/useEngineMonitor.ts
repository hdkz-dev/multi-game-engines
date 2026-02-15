import { useCallback, useSyncExternalStore, useEffect, useMemo } from "react";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  IMiddleware,
} from "@multi-game-engines/core";
import {
  MonitorRegistry,
  SearchStateTransformer,
  EngineSearchState,
  ExtendedSearchInfo,
  UINormalizerMiddleware,
} from "@multi-game-engines/ui-core";

/**
 * エンジンの思考状況をリアクティブに監視するカスタムフック。
 *
 * 2026 Best Practice:
 * - MonitorRegistry による購読の重複排除 (Deduplication)。
 * - 宣言的なミドルウェア登録と自動ライフサイクル管理。
 */
export function useEngineMonitor<
  T_STATE extends EngineSearchState = EngineSearchState,
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

  // 根本的な改善: レジストリから共有モニターを取得
  const monitor = useMemo(() => {
    // UIミドルウェアの動的注入 (初回のみ)
    if (autoMiddleware && typeof engine.use === "function") {
      const normalizer = new UINormalizerMiddleware<
        T_OPTIONS,
        unknown,
        T_RESULT
      >();

      // 内部実装の詳細としてキャストを許容
      engine.use(
        normalizer as unknown as IMiddleware<T_OPTIONS, T_INFO, T_RESULT>,
      );
    }

    return MonitorRegistry.getInstance().getOrCreateMonitor<
      T_STATE,
      T_OPTIONS,
      T_INFO,
      T_RESULT
    >(engine, initialPosition, transformer);
  }, [engine, initialPosition, transformer, autoMiddleware]);

  useEffect(() => {
    monitor.startMonitoring();
    return () => {
      // 共有モニターのため、ここでは何もしない
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
