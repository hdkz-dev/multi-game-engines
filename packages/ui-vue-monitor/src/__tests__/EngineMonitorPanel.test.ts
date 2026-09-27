import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { computed, ref, shallowRef } from "vue";
import {
  EngineError,
  EngineErrorCode,
  createPositionString,
  type IEngine,
  type EngineStatus,
  type IBaseSearchResult,
  type IBaseSearchOptions,
  type IBaseSearchInfo,
} from "@multi-game-engines/core";
import {
  createInitialState,
  createUIStrings,
} from "@multi-game-engines/ui-core";
import { useEngineMonitor } from "../useEngineMonitor.js";
import EngineMonitorPanel from "../components/EngineMonitorPanel.vue";

vi.mock("../useEngineMonitor.js", () => ({ useEngineMonitor: vi.fn() }));
vi.mock("@multi-game-engines/ui-vue-core", () => ({
  useEngineUI: () => ({ strings: createUIStrings({}) }),
}));

function createTestEngine(): IEngine<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  const engine: IEngine<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  > = {
    id: "test-engine",
    name: "Test Engine",
    version: "1.0.0",
    status: "ready",
    lastError: null,
    use: vi.fn(() => engine),
    unuse: vi.fn(() => engine),
    load: vi.fn().mockResolvedValue(undefined),
    consent: vi.fn(),
    setBook: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue({ bestMove: null }),
    stop: vi.fn(),
    dispose: vi.fn().mockResolvedValue(undefined),
    onInfo: vi.fn(() => vi.fn()),
    onSearchResult: vi.fn(() => vi.fn()),
    onStatusChange: vi.fn(() => vi.fn()),
    onTelemetry: vi.fn(() => vi.fn()),
    emitTelemetry: vi.fn(),
  };
  return engine;
}

beforeEach(() => {
  vi.spyOn(performance, "now").mockReturnValue(12345);
  vi.mocked(useEngineMonitor).mockReturnValue({
    state: ref(createInitialState(createPositionString("startpos"))),
    status: computed<EngineStatus>(() => "ready"),
    search: vi.fn().mockResolvedValue({ bestMove: null }),
    stop: vi.fn().mockResolvedValue(undefined),
    monitor: shallowRef(null),
  });
});
afterEach(() => vi.restoreAllMocks());

describe("EngineMonitorPanel command failures", () => {
  it.each(["search", "stop"] as const)(
    "displays an unexpected %s rejection",
    async (command) => {
      const error = new Error(`${command} transport failed`);
      vi.mocked(useEngineMonitor).mockReturnValue({
        ...useEngineMonitor(null),
        status: computed<EngineStatus>(() =>
          command === "stop" ? "busy" : "ready",
        ),
        [command]: vi.fn().mockRejectedValue(error),
      });
      const wrapper = mount(EngineMonitorPanel, {
        props: { engine: createTestEngine(), searchOptions: {} },
      });
      try {
        const strings = createUIStrings({});
        const label = command === "stop" ? strings.stop : strings.start;
        const button = wrapper
          .findAll("button")
          .find((button) => button.text() === label);
        expect(button).toBeDefined();
        await button!.trigger("click");
        await flushPromises();
        expect(wrapper.text()).toContain(error.message);
      } finally {
        wrapper.unmount();
      }
    },
  );

  it.each(["search", "stop"] as const)(
    "isolates %s failures across engine replacements",
    async (command) => {
      const oldEngine = createTestEngine();
      const nextEngine = createTestEngine();
      let rejectOld!: (reason: unknown) => void;
      const oldPending = new Promise<never>((_resolve, reject) => {
        rejectOld = reject;
      });
      const run = vi
        .fn()
        .mockRejectedValueOnce(new Error("Previous failure"))
        .mockReturnValueOnce(oldPending)
        .mockRejectedValueOnce(new Error("Current failure"));
      vi.mocked(useEngineMonitor).mockReturnValue({
        ...useEngineMonitor(null),
        status: computed<EngineStatus>(() =>
          command === "stop" ? "busy" : "ready",
        ),
        [command]: run,
      });
      const wrapper = mount(EngineMonitorPanel, {
        props: { engine: oldEngine, searchOptions: {} },
      });
      try {
        const strings = createUIStrings({});
        const label = command === "stop" ? strings.stop : strings.start;
        const click = async () => {
          const button = wrapper
            .findAll("button")
            .find((item) => item.text() === label);
          expect(button).toBeDefined();
          await button!.trigger("click");
          await flushPromises();
        };
        await click();
        expect(wrapper.text()).toContain("Previous failure");
        await wrapper.setProps({ engine: nextEngine });
        expect(wrapper.text()).not.toContain("Previous failure");
        await click();
        await wrapper.setProps({ engine: oldEngine });
        await click();
        expect(wrapper.text()).toContain("Current failure");
        rejectOld(new Error("Stale failure"));
        await flushPromises();
        expect(wrapper.text()).not.toContain("Stale failure");
        expect(wrapper.text()).toContain("Current failure");
      } finally {
        wrapper.unmount();
      }
    },
  );

  it("ignores an earlier search failure after stopping", async () => {
    let rejectSearch!: (reason: unknown) => void;
    const pending = new Promise<never>((_resolve, reject) => {
      rejectSearch = reject;
    });
    const status = ref<EngineStatus>("ready");
    const stop = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useEngineMonitor).mockReturnValue({
      ...useEngineMonitor(null),
      status: computed(() => status.value),
      search: vi.fn().mockReturnValue(pending),
      stop,
    });
    const wrapper = mount(EngineMonitorPanel, {
      props: { engine: createTestEngine(), searchOptions: {} },
    });
    try {
      const click = async (label: string) => {
        const button = wrapper
          .findAll("button")
          .find((item) => item.text() === label);
        expect(button).toBeDefined();
        await button!.trigger("click");
        await flushPromises();
      };
      const strings = createUIStrings({});
      await click(strings.start);
      status.value = "busy";
      await flushPromises();
      await click(strings.stop);
      rejectSearch(new Error("Stale search failure"));
      await flushPromises();
      expect(stop).toHaveBeenCalledOnce();
      expect(wrapper.text()).not.toContain("Stale search failure");
    } finally {
      wrapper.unmount();
    }
  });

  it("handles search cancellation without rendering an error", async () => {
    const error = new EngineError({
      code: EngineErrorCode.SEARCH_ABORTED,
      message: "Stop requested",
    });
    let rejectSearch!: (reason: unknown) => void;
    const pending = new Promise<IBaseSearchResult>((_resolve, reject) => {
      rejectSearch = reject;
    });
    const search = vi.fn().mockReturnValue(pending);
    vi.mocked(useEngineMonitor).mockReturnValue({
      ...useEngineMonitor(null),
      search,
    });
    const wrapper = mount(EngineMonitorPanel, {
      props: { engine: createTestEngine(), searchOptions: {} },
    });
    try {
      const button = wrapper
        .findAll("button")
        .find((button) => button.text() === createUIStrings({}).start);
      expect(button).toBeDefined();
      await button!.trigger("click");
      expect(search).toHaveBeenCalledOnce();
      rejectSearch(error);
      await flushPromises();
      expect(wrapper.text()).not.toContain(error.message);
      expect(wrapper.find('[role="alert"]').text()).toBe("");
    } finally {
      wrapper.unmount();
    }
  });
});
