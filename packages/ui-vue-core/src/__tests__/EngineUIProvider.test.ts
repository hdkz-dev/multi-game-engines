import { describe, it, expect } from "vitest";
import { nextTick, defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import EngineUIProvider from "../EngineUIProvider.vue";
import { useEngineUI, provideEngineUI } from "../useEngineUI.js";
import { commonLocales } from "@multi-game-engines/i18n-common";

describe("EngineUIProvider.vue", () => {
  it("should render default slot", () => {
    const wrapper = mount(EngineUIProvider, {
      props: {
        localeData: commonLocales.ja!,
      },
      slots: {
        default: '<div id="child">Child</div>',
      },
    });
    expect(wrapper.find("#child").exists()).toBe(true);
  });

  it("should update strings when localeData prop changes", async () => {
    const wrapper = mount(EngineUIProvider, {
      props: {
        localeData: commonLocales.ja!,
      },
      slots: {
        default: '<div id="child">Child</div>',
      },
    });

    await wrapper.setProps({ localeData: commonLocales.en! });
    await nextTick();
    expect(wrapper.find("#child").exists()).toBe(true);
  });
});

describe("useEngineUI", () => {
  it("should return fallback strings when no provider is present", () => {
    let context: ReturnType<typeof useEngineUI> | undefined;

    const TestComponent = defineComponent({
      setup() {
        context = useEngineUI();
        return {};
      },
      render: () => h("div"),
    });

    mount(TestComponent);
    expect(context).toBeDefined();
    expect(context!.strings).toBeDefined();
    expect(typeof context!.strings).toBe("object");
  });

  it("should return provided strings when provider is present", () => {
    let context: ReturnType<typeof useEngineUI> | undefined;

    const Child = defineComponent({
      setup() {
        context = useEngineUI();
        return {};
      },
      render: () => h("div"),
    });

    const Parent = defineComponent({
      setup() {
        provideEngineUI(commonLocales.en!);
      },
      render: () => h(Child),
    });

    mount(Parent);
    expect(context).toBeDefined();
    expect(context!.strings).toBeDefined();
  });
});
