import {
  ref,
  onUnmounted,
  watch,
  computed,
  toValue,
  Ref,
  ComputedRef,
  MaybeRefOrGetter,
} from "vue";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  createPositionString,
} from "@multi-game-engines/core";
import {
  MonitorRegistry,
  SearchStateTransformer,
  EngineSearchState,
  ExtendedSearchInfo,
  UINormalizerMiddleware,
  SearchMonitor,
  CommandDispatcher,
  createInitialState,
} from "@multi-game-engines/ui-core";

/**
 * useEngineMonitor の戻り値型を明示的に定義。
 */
export interface UseEngineMonitorReturn<
  T_STATE,
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends ExtendedSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  state: Ref<T_STATE>;
  status: ComputedRef<EngineStatus>;
  search: (searchOptions: T_OPTIONS) => Promise<T_RESULT>;
  stop: () => Promise<void>;
  monitor: Ref<SearchMonitor<T_STATE, T_OPTIONS, T_INFO, T_RESULT> | null>;
}

/**
 * エンジンの思考状況をリアクティブに監視する Vue Composable。
 */
export function useEngineMonitor<
  T_STATE extends EngineSearchState = EngineSearchState,
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends ExtendedSearchInfo = ExtendedSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
>(
  engineSource: MaybeRefOrGetter<
    IEngine<T_OPTIONS, T_INFO, T_RESULT> | null | undefined
  >,
  options: {
    initialPosition?: string;
    transformer?: (state: T_STATE, info: T_INFO) => T_STATE;
    autoMiddleware?: boolean;
  } = {},
): UseEngineMonitorReturn<T_STATE, T_OPTIONS, T_INFO, T_RESULT> {
  const {
    initialPosition = "startpos",
    transformer = (state: T_STATE, info: T_INFO): T_STATE =>
      SearchStateTransformer.mergeInfo<T_STATE>(state, info),
    autoMiddleware = true,
  } = options;

  // ダミー状態の作成 (初期化前やエラー時のフォールバック)
  const createDummyState = (): T_STATE => {
    try {
      const brandedPos = createPositionString(initialPosition);
      return createInitialState<T_STATE>(brandedPos);
    } catch {
      const safePos = createPositionString("startpos");
      return createInitialState<T_STATE>(safePos);
    }
  };

  const state = ref<T_STATE>(createDummyState()) as Ref<T_STATE>;
  const engineStatus = ref<EngineStatus>("uninitialized");
  const optimisticStatus = ref<EngineStatus | null>(null);
  const monitor = ref<SearchMonitor<
    T_STATE,
    T_OPTIONS,
    T_INFO,
    T_RESULT
  > | null>(null);
  const dispatcher = ref<CommandDispatcher<
    T_STATE,
    T_OPTIONS,
    T_INFO,
    T_RESULT
  > | null>(null);

  let unsubStore: (() => void) | null = null;
  let unsubStatus: (() => void) | null = null;

  const cleanup = () => {
    if (unsubStore) {
      unsubStore();
      unsubStore = null;
    }
    if (unsubStatus) {
      unsubStatus();
      unsubStatus = null;
    }
    if (monitor.value) {
      monitor.value.stopMonitoring();
      monitor.value = null;
    }
    dispatcher.value = null;
  };

  // 2026 Best Practice: MaybeRefOrGetter を監視し、toValue で評価
  watch(
    () => toValue(engineSource),
    (newEngine) => {
      cleanup();

      if (!newEngine) {
        engineStatus.value = "uninitialized";
        state.value = createDummyState();
        return;
      }

      // ミドルウェア登録 (初回のみ)
      if (autoMiddleware && typeof newEngine.use === "function") {
        const normalizer = new UINormalizerMiddleware<
          T_OPTIONS,
          T_INFO,
          T_RESULT
        >();
        newEngine.use(normalizer);
      }

      const m = MonitorRegistry.getInstance().getOrCreateMonitor<
        T_STATE,
        T_OPTIONS,
        T_INFO,
        T_RESULT
      >(newEngine, initialPosition, transformer);
      monitor.value = m;

      const d = new CommandDispatcher(m, (s: EngineStatus) => {
        optimisticStatus.value = s;
      });
      dispatcher.value = d;

      // 監視開始
      m.startMonitoring();
      state.value = m.getSnapshot() as T_STATE;

      unsubStore = m.subscribe(() => {
        state.value = m.getSnapshot() as T_STATE;
      });

      engineStatus.value = newEngine.status;
      unsubStatus = newEngine.onStatusChange((newStatus) => {
        engineStatus.value = newStatus;
        optimisticStatus.value = null;
      });
    },
    { immediate: true },
  );

  onUnmounted(cleanup);

  const search = (searchOptions: T_OPTIONS) => {
    if (!dispatcher.value)
      return Promise.reject(new Error("ENGINE_NOT_AVAILABLE"));
    return dispatcher.value.dispatchSearch(searchOptions);
  };

  const stop = async () => {
    if (dispatcher.value) {
      await dispatcher.value.dispatchStop();
    }
  };

  return {
    state,
    status: computed(() => optimisticStatus.value ?? engineStatus.value),
    search,
    stop,
    monitor: monitor as Ref<SearchMonitor<
      T_STATE,
      T_OPTIONS,
      T_INFO,
      T_RESULT
    > | null>,
  };
}
