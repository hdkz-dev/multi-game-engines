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
    return MonitorRegistry.getInstance().getOrCreateMonitor<
      T_STATE,
      T_OPTIONS,
      T_INFO,
      T_RESULT
    >(engine, initialPosition, transformer);
  }, [engine, initialPosition, transformer]);

  // 2. 状態同期
  const state = useSyncExternalStore(
    monitor.subscribe,
    monitor.getSnapshot,
    monitor.getSnapshot,
  );

  // 3. リアクティブなステータス管理
  const [engineStatus, setEngineStatus] = useState<EngineStatus>(engine.status);
  const [optimisticStatus, setOptimisticStatus] = useState<EngineStatus | null>(
    null,
  );
  const currentStatus = optimisticStatus ?? engineStatus;

  // 4. コマンド・ディスパッチャーの統合
  const dispatcher = useMemo(
    () =>
      new CommandDispatcher(monitor, (s: EngineStatus) =>
        setOptimisticStatus(s),
      ),
    [monitor],
  );

  // 5. エフェクト: 監視開始とミドルウェア登録
  useEffect(() => {
    // ミドルウェアの動的登録
    // Note: engine.use の戻り値として解除関数がないため、二重登録防止は MonitorRegistry 側の冪等性に依存するが、
    // ここでは useEffect の依存配列を厳密に管理することで対応。
    // 将来的に IEngine に removeMiddleware が実装されたらクリーンアップに追加する。
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

    monitor.startMonitoring();

    // ステータス同期
    const unsubStatus = engine.onStatusChange((newStatus) => {
      setEngineStatus(newStatus);
      setOptimisticStatus(null);
    });

    return () => {
      unsubStatus();
      monitor.stopMonitoring();
    };
  }, [monitor, engine, autoMiddleware]);

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
