import {
  useCallback,
  useSyncExternalStore,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  IMiddleware,
  EngineStatus,
} from "@multi-game-engines/core";
import {
  MonitorRegistry,
  SearchStateTransformer,
  EngineSearchState,
  ExtendedSearchInfo,
  UINormalizerMiddleware,
  CommandDispatcher,
} from "@multi-game-engines/ui-core";

/**
 * エンジンの思考状況を監視し、楽観的更新を伴うコマンド実行を提供するカスタムフック。
 *
 * 2026 Zenith Practice:
 * - CommandDispatcher による Optimistic UI 制御。
 * - システム全体のテレメトリと連動した状態同期。
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

  // 1. Monitor の共有取得
  const monitor = useMemo(() => {
    if (autoMiddleware && typeof engine.use === "function") {
      const normalizer = new UINormalizerMiddleware<
        T_OPTIONS,
        unknown,
        T_RESULT
      >();
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

  // 2. 状態同期
  const state = useSyncExternalStore(
    monitor.subscribe,
    monitor.getSnapshot,
    monitor.getSnapshot,
  );

  // 3. 楽観的ステータス管理
  const [optimisticStatus, setOptimisticStatus] = useState<EngineStatus | null>(
    null,
  );
  const currentStatus = optimisticStatus ?? engine.status;

  // 4. コマンド・ディスパッチャーの統合
  const dispatcher = useMemo(
    () =>
      new CommandDispatcher(monitor, (s: EngineStatus) =>
        setOptimisticStatus(s),
      ),
    [monitor],
  );

  useEffect(() => {
    monitor.startMonitoring();
    // エンジンの実状態が変化したら楽観的状態をクリア
    const unsub = engine.onStatusChange(() => setOptimisticStatus(null));
    return () => unsub();
  }, [monitor, engine]);

  const search = useCallback(
    (searchOptions: T_OPTIONS) => dispatcher.dispatchSearch(searchOptions),
    [dispatcher],
  );

  const stop = useCallback(() => dispatcher.dispatchStop(), [dispatcher]);

  return {
    state,
    status: currentStatus,
    search,
    stop,
    monitor,
  };
}
