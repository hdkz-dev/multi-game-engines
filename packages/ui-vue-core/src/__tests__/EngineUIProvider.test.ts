import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import EngineUIProvider from "../EngineUIProvider.vue";
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
});
