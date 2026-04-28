import { inject, provide, markRaw, reactive, ref, Ref } from "vue";
import { EngineUIStrings, createUIStrings } from "@multi-game-engines/ui-core";

const EngineUIKey = Symbol.for("EngineUI");

export interface EngineUIContext {
  strings: Ref<EngineUIStrings>;
}

/** Reactive wrapper returned by useEngineUI(). `strings` is the live EngineUIStrings value. */
export interface EngineUIBinding {
  readonly strings: EngineUIStrings;
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
 *
 * Returns a reactive `{ strings: EngineUIStrings }` binding.
 * The `strings` property is auto-reactive: any update to the locale via
 * EngineUIProvider will trigger re-renders in consuming components.
 *
 * Implementation note: we deliberately return a `reactive` getter rather than
 * `Ref<EngineUIStrings>` so that vue-tsc (≥3.2) can type-check template
 * expressions like `{{ strings.depth }}` without false-positive TS2339 errors.
 */
export function useEngineUI(): EngineUIBinding {
  const context = inject<EngineUIContext>(EngineUIKey);
  const stringsRef: Ref<EngineUIStrings> =
    context?.strings ?? ref(createUIStrings({ engine: {} }));

  // `reactive` with a getter tracks stringsRef.value as a reactive dependency.
  // When stringsRef.value changes the reactive proxy notifies dependents.
  return reactive({
    get strings(): EngineUIStrings {
      // markRaw prevents Vue from deeply proxying the EngineUIStrings object,
      // which would turn function-typed properties (mateIn, advantage, …) into
      // non-callable reactive wrappers in Vue 3.5+.
      return markRaw(stringsRef.value);
    },
  }) as EngineUIBinding;
}
