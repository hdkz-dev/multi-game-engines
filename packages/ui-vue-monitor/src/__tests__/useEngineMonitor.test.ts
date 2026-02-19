import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { defineComponent, h } from "vue";
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
  onStatusChange = () => () => {};
  onInfo = () => () => {};
  onSearchResult = () => () => {};
  onTelemetry = () => () => {};
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
});
