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
  EngineStatus,
  createPositionString,
} from "@multi-game-engines/core";
import {
  createInitialState,
  MonitorRegistry,
  SearchStateTransformer,
  EngineSearchState,
  ExtendedSearchInfo,
  UINormalizerMiddleware,
  CommandDispatcher,
  PositionString,
} from "@multi-game-engines/ui-core";

/**
 * 2026 Zenith Constants
 */
const ERR_ENGINE_NOT_AVAILABLE = "ENGINE_NOT_AVAILABLE";

/**
 * エンジンの思考状況を監視し、楽観的更新を伴うコマンド実行を提供するカスタムフック。
 *
 * 2026 Zenith Practice:
 * - CommandDispatcher による Optimistic UI 制御。
 * - システム全体のテレメトリと連動した状態同期。
 * - SSR (Server-Side Rendering) に配慮した堅牢な設計。
 */
export function useEngineMonitor<
  T_STATE extends EngineSearchState = EngineSearchState,
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends ExtendedSearchInfo = ExtendedSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
>(
  engine: IEngine<T_OPTIONS, T_INFO, T_RESULT> | undefined | null,
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

  // SSR 対応およびエンジン不在時のフォールバック用初期状態
  const dummyState = useMemo(() => {
    try {
      const brandedPos = createPositionString(initialPosition);
      return createInitialState<T_STATE>(brandedPos);
    } catch {
      // バリデーション失敗時は最小限の空の状態で復旧
      return {
        isSearching: false,
        position: initialPosition as PositionString,
        pvs: [],
        evaluationHistory: { entries: [], maxEntries: 50 },
        searchLog: [],
        stats: { depth: 0, nodes: 0, nps: 0, time: 0 },
      } as unknown as T_STATE;
    }
  }, [initialPosition]);

  // 1. Monitor の共有取得
  const monitor = useMemo(() => {
    if (!engine) return null;
    return MonitorRegistry.getInstance().getOrCreateMonitor<
      T_STATE,
      T_OPTIONS,
      T_INFO,
      T_RESULT
    >(engine, initialPosition, transformer);
  }, [engine, initialPosition, transformer]);

  // 2. 状態同期 (useSyncExternalStore)
  const state = useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) => {
        if (!monitor) return () => {};
        return monitor.subscribe(onStoreChange);
      },
      [monitor],
    ),
    () => monitor?.getSnapshot() ?? dummyState,
    () => dummyState,
  );

  // 3. リアクティブなステータス管理
  const [engineStatus, setEngineStatus] = useState<EngineStatus>(
    engine?.status ?? "ready",
  );
  const [optimisticStatus, setOptimisticStatus] = useState<EngineStatus | null>(
    null,
  );
  const currentStatus = optimisticStatus ?? engineStatus;

  // 4. コマンド・ディスパッチャーの統合
  const dispatcher = useMemo(
    () =>
      monitor
        ? new CommandDispatcher(monitor, (s: EngineStatus) =>
            setOptimisticStatus(s),
          )
        : null,
    [monitor],
  );

  // 5. エフェクト: 監視開始とミドルウェア登録
  useEffect(() => {
    if (!monitor || !engine) return;

    // ミドルウェアの動的登録
    if (autoMiddleware && typeof engine.use === "function") {
      const normalizer = new UINormalizerMiddleware<
        T_OPTIONS,
        T_INFO,
        T_RESULT
      >();
      engine.use(normalizer);
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
    (searchOptions: T_OPTIONS) => {
      if (!dispatcher)
        return Promise.reject(new Error(ERR_ENGINE_NOT_AVAILABLE));
      return dispatcher.dispatchSearch(searchOptions);
    },
    [dispatcher],
  );

  const stop = useCallback(() => {
    if (!dispatcher) return;
    void dispatcher.dispatchStop();
  }, [dispatcher]);

  return {
    state,
    status: currentStatus,
    search,
    stop,
    monitor,
  };
}
