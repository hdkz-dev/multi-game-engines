import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { defineComponent, h, ref } from "vue";
import { mount } from "@vue/test-utils";
import { useEngineMonitor } from "../useEngineMonitor.js";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  IBaseSearchInfo,
} from "@multi-game-engines/core";
import { ExtendedSearchInfo } from "@multi-game-engines/ui-core";

// 2026 Best Practice: SearchMonitor が必要とするメソッドを完全に網羅したモック
class LocalMockEngine implements Partial<
  IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>
> {
  id = "mock-vue-engine";
  name = "MockEngine";
  status: EngineStatus = "ready";
  private _statusListeners: ((s: EngineStatus) => void)[] = [];
  onStatusChange = (fn: (s: EngineStatus) => void) => {
    this._statusListeners.push(fn);
    return () => {
      this._statusListeners = this._statusListeners.filter((l) => l !== fn);
    };
  };
  emitStatus(s: EngineStatus) {
    this._statusListeners.forEach((fn) => fn(s));
  }
  onInfo = () => () => {};
  onSearchResult = () => () => {};
  onTelemetry = () => () => {};
  stop = vi.fn().mockResolvedValue(undefined);
  search = vi.fn().mockResolvedValue({ bestMove: "e2e4" });
  unuse = vi.fn();
  use = () =>
    this as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
}

describe("useEngineMonitor (Vue)", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should initialize within component lifecycle", () => {
    const engine = new LocalMockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    >;

    const TestComponent = defineComponent({
      setup() {
        const result = useEngineMonitor(engine);
        return { result };
      },
      render: () => h("div"),
    });

    const wrapper = mount(TestComponent);
    expect(wrapper.vm.result.status.value).toBe("ready");
  });

  it("should throw EngineError for empty initialPosition", () => {
    const engine = new LocalMockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    >;
    expect(() => {
      useEngineMonitor(engine, { initialPosition: "" });
    }).toThrow(/Invalid PositionString/);
  });

  it("should throw EngineError for whitespace-only initialPosition", () => {
    const engine = new LocalMockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    >;
    expect(() => {
      useEngineMonitor(engine, { initialPosition: "   " });
    }).toThrow(/Invalid PositionString/);
  });

  it("should throw EngineError for injection-like initialPosition", () => {
    const engine = new LocalMockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    >;
    expect(() => {
      useEngineMonitor(engine, { initialPosition: "startpos\nquit" });
    }).toThrow(/Potential command injection/);
  });

  it("should reject search when dispatcher is null (no engine)", () => {
    const TestComponent = defineComponent({
      setup() {
        const result = useEngineMonitor<
          never,
          IBaseSearchOptions,
          ExtendedSearchInfo,
          IBaseSearchResult
        >(null);
        return { result };
      },
      render: () => h("div"),
    });
    const wrapper = mount(TestComponent);
    return expect(
      wrapper.vm.result.search({} as IBaseSearchOptions),
    ).rejects.toThrow("ENGINE_NOT_AVAILABLE");
  });

  it("should call stop without error when dispatcher is null", async () => {
    const TestComponent = defineComponent({
      setup() {
        const result = useEngineMonitor<
          never,
          IBaseSearchOptions,
          ExtendedSearchInfo,
          IBaseSearchResult
        >(null);
        return { result };
      },
      render: () => h("div"),
    });
    const wrapper = mount(TestComponent);
    await expect(wrapper.vm.result.stop()).resolves.toBeUndefined();
  });

  it("should call stop with active dispatcher", async () => {
    const engine = new LocalMockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    >;
    const TestComponent = defineComponent({
      setup() {
        const result = useEngineMonitor(engine);
        return { result };
      },
      render: () => h("div"),
    });
    const wrapper = mount(TestComponent);
    await expect(wrapper.vm.result.stop()).resolves.toBeUndefined();
  });

  it("should call search with active dispatcher", async () => {
    const engine = new LocalMockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    >;
    const TestComponent = defineComponent({
      setup() {
        const result = useEngineMonitor(engine);
        return { result };
      },
      render: () => h("div"),
    });
    const wrapper = mount(TestComponent);
    const result = await wrapper.vm.result.search({} as IBaseSearchOptions);
    expect(result).toBeDefined();
  });

  it("should trigger cleanup when engine ref changes to null", async () => {
    const engineRef = ref<IEngine<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    > | null>(
      new LocalMockEngine() as unknown as IEngine<
        IBaseSearchOptions,
        ExtendedSearchInfo,
        IBaseSearchResult
      >,
    );
    const TestComponent = defineComponent({
      setup() {
        const result = useEngineMonitor(engineRef);
        return { result };
      },
      render: () => h("div"),
    });
    const wrapper = mount(TestComponent);
    expect(wrapper.vm.result.status.value).toBe("ready");
    engineRef.value = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.result.status.value).toBe("uninitialized");
  });

  it("should update status when engine emits status change", async () => {
    const rawEngine = new LocalMockEngine();
    const engine = rawEngine as unknown as IEngine<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    >;
    const TestComponent = defineComponent({
      setup() {
        const result = useEngineMonitor(engine);
        return { result };
      },
      render: () => h("div"),
    });
    const wrapper = mount(TestComponent);
    expect(wrapper.vm.result.status.value).toBe("ready");
    rawEngine.emitStatus("busy");
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.result.status.value).toBe("busy");
  });

  it("should trigger watcher cleanup on unmount", async () => {
    const engine = new LocalMockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    >;
    const TestComponent = defineComponent({
      setup() {
        const result = useEngineMonitor(engine);
        return { result };
      },
      render: () => h("div"),
    });
    const wrapper = mount(TestComponent);
    await wrapper.vm.$nextTick();
    wrapper.unmount();
  });
});
