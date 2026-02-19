import {
  ref,
  watch,
  computed,
  toValue,
  Ref,
  ComputedRef,
  MaybeRefOrGetter,
  onWatcherCleanup,
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
  UI_NORMALIZER_MIDDLEWARE_ID,
} from "@multi-game-engines/ui-core";
import { useEngineUI } from "@multi-game-engines/ui-vue-core";

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
    } catch (err) {
      console.warn(
        `[useEngineMonitor] Validation failed for initialPosition: "${initialPosition}". 
        Check if the position string matches the engine's protocol (e.g., FEN for Chess, SFEN for Shogi). 
        Falling back to "startpos". Original error:`,
        err,
      );
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

  // 2026 Best Practice: Vue 3.5+ onWatcherCleanup によるクリーンアップ管理
  watch(
    () => toValue(engineSource),
    (newEngine) => {
      if (!newEngine) {
        engineStatus.value = "uninitialized";
        state.value = createDummyState();
        return;
      }

      // ミドルウェア登録 (初回のみ)
      let didRegister = false;
      if (autoMiddleware && typeof newEngine.use === "function") {
        const normalizer = new UINormalizerMiddleware<
          T_OPTIONS,
          T_INFO,
          T_RESULT
        >();
        newEngine.use(normalizer);
        didRegister = true;
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

      // 変数への代入
      const unsubStore = m.subscribe(() => {
        state.value = m.getSnapshot() as T_STATE;
      });

      engineStatus.value = newEngine.status;
      const unsubStatus = newEngine.onStatusChange((newStatus) => {
        engineStatus.value = newStatus;
        optimisticStatus.value = null;
      });

      // クリーンアップ登録 (Vue 3.5+)
      // 監視対象が変わる直前、またはコンポーネントがアンマウントされる際に実行される
      onWatcherCleanup(() => {
        unsubStore();
        unsubStatus();
        if (monitor.value) {
          monitor.value.stopMonitoring();
          monitor.value = null;
        }
        if (didRegister && typeof newEngine.unuse === "function") {
          newEngine.unuse(UI_NORMALIZER_MIDDLEWARE_ID);
        }
        dispatcher.value = null;
      });
    },
    { immediate: true },
  );

  const search = (searchOptions: T_OPTIONS) => {
    if (!dispatcher.value) {
      return Promise.reject(new Error("ENGINE_NOT_AVAILABLE"));
    }
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
