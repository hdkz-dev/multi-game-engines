import { ref, onUnmounted, onMounted, computed, Ref, ComputedRef } from "vue";
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
  SearchMonitor,
  CommandDispatcher,
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
  monitor: SearchMonitor<T_STATE, T_OPTIONS, T_INFO, T_RESULT>;
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
  engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>,
  options: {
    initialPosition?: string;
    transformer?: (state: T_STATE, info: T_INFO) => T_STATE;
    autoMiddleware?: boolean;
  } = {},
): UseEngineMonitorReturn<T_STATE, T_OPTIONS, T_INFO, T_RESULT> {
  const {
    initialPosition = "startpos",
    transformer = (options.transformer ?? SearchStateTransformer.mergeInfo) as (
      state: T_STATE,
      info: T_INFO,
    ) => T_STATE,
    autoMiddleware = true,
  } = options;

  const monitor = MonitorRegistry.getInstance().getOrCreateMonitor<
    T_STATE,
    T_OPTIONS,
    T_INFO,
    T_RESULT
  >(engine, initialPosition, transformer);

  // 2026 Best Practice: ShallowRef ではなく Ref を使用し、推論を安定させる
  const state = ref<T_STATE>(monitor.getSnapshot() as T_STATE) as Ref<T_STATE>;
  const engineStatus = ref<EngineStatus>(engine.status);
  const optimisticStatus = ref<EngineStatus | null>(null);
  const status = computed<EngineStatus>(
    () => optimisticStatus.value ?? engineStatus.value,
  );

  const dispatcher = new CommandDispatcher(monitor, (s: EngineStatus) => {
    optimisticStatus.value = s;
  });

  let unsubStore: (() => void) | null = null;
  let unsubStatus: (() => void) | null = null;

  onMounted(() => {
    if (autoMiddleware && typeof engine.use === "function") {
      const normalizer = new UINormalizerMiddleware<
        T_OPTIONS,
        unknown,
        T_RESULT
      >();
      engine.use(normalizer as IMiddleware<T_OPTIONS, T_INFO, T_RESULT>);
    }

    monitor.startMonitoring();
    unsubStore = monitor.subscribe(() => {
      state.value = monitor.getSnapshot() as T_STATE;
    });

    unsubStatus = engine.onStatusChange((newStatus) => {
      engineStatus.value = newStatus;
      optimisticStatus.value = null;
    });
  });

  onUnmounted(() => {
    if (unsubStore) unsubStore();
    if (unsubStatus) unsubStatus();
  });

  const search = (searchOptions: T_OPTIONS) =>
    dispatcher.dispatchSearch(searchOptions);
  const stop = () => dispatcher.dispatchStop();

  return {
    state,
    status,
    search,
    stop,
    monitor,
  };
}
