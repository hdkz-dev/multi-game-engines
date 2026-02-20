import { inject, provide, ref, Ref } from "vue";
import { EngineUIStrings, createUIStrings } from "@multi-game-engines/ui-core";

const EngineUIKey = Symbol("EngineUI");

export interface EngineUIContext {
  strings: Ref<EngineUIStrings>;
}

/**
 * UI コンテキストを提供します。
 */
export function provideEngineUI(localeData: unknown) {
  const strings = ref(createUIStrings(localeData));

  const context: EngineUIContext = {
    strings,
  };

  provide(EngineUIKey, context);
  return context;
}

/**
 * UI コンテキストを利用します。
 */
export function useEngineUI(): EngineUIContext {
  const context = inject<EngineUIContext>(EngineUIKey);
  if (!context) {
    // フォールバック用のデフォルト文字列
    return {
      strings: ref(createUIStrings({ engine: {} })),
    };
  }
  return context;
}
