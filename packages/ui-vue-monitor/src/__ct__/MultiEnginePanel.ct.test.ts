import { test, expect } from "@playwright/experimental-ct-vue";
import type {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineStatus,
} from "@multi-game-engines/core";
import MultiEnginePanel from "../components/MultiEnginePanel.vue";

/**
 * CT tests for MultiEnginePanel (Vue).
 *
 * Renders multiple stub engines and verifies:
 * - Score comparison bar ARIA roles
 * - Engine list with listitem roles
 * - Grid layout classes by engine count
 * - Label fallback to engine.name
 * - Initial "—" score when no PVs
 * - Separator dividers between engine summaries
 */

type StubEngine = IEngine<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
>;

function makeStubEngine(
  id: string,
  name: string,
  overrides: Partial<StubEngine> = {},
): StubEngine {
  return {
    id,
    name,
    version: "1.0.0",
    status: "ready" as EngineStatus,
    lastError: null,
    use: () => ({}) as StubEngine,
    unuse: () => ({}) as StubEngine,
    load: async () => {},
    consent: () => {},
    setBook: async () => {},
    search: async () => ({ bestMove: null }),
    stop: () => {},
    dispose: async () => {},
    onInfo: () => () => {},
    onSearchResult: () => () => {},
    onStatusChange: () => () => {},
    onTelemetry: () => () => {},
    emitTelemetry: () => {},
    ...overrides,
  };
}

const DEFAULT_OPTIONS: IBaseSearchOptions = {};

test.describe("MultiEnginePanel (Vue CT)", () => {
  test("renders nothing when engines array is empty", async ({ mount }) => {
    const component = await mount(MultiEnginePanel, {
      props: { engines: [] },
    });
    await expect(component).not.toBeVisible();
  });

  test("renders score comparison bar with correct role", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: DEFAULT_OPTIONS,
      },
      {
        engine: makeStubEngine("lc0", "Leela Chess Zero"),
        searchOptions: DEFAULT_OPTIONS,
      },
    ];
    const component = await mount(MultiEnginePanel, {
      props: { engines },
    });

    const bar = component.getByRole("group", { name: "Score comparison" });
    await expect(bar).toBeVisible();
  });

  test("renders engine list with correct ARIA role", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: DEFAULT_OPTIONS,
      },
      {
        engine: makeStubEngine("yaneuraou", "Yaneura Ou"),
        searchOptions: DEFAULT_OPTIONS,
      },
    ];
    const component = await mount(MultiEnginePanel, {
      props: { engines },
    });

    const list = component.getByRole("list", { name: "Engine panels" });
    await expect(list).toBeVisible();
    const items = list.getByRole("listitem");
    await expect(items).toHaveCount(2);
  });

  test("single engine renders grid-cols-1 layout", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: DEFAULT_OPTIONS,
      },
    ];
    const component = await mount(MultiEnginePanel, {
      props: { engines },
    });

    const list = component.getByRole("list", { name: "Engine panels" });
    await expect(list).toHaveClass(/grid-cols-1/);
  });

  test("two engines render md:grid-cols-2 layout", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: DEFAULT_OPTIONS,
      },
      {
        engine: makeStubEngine("lc0", "Leela"),
        searchOptions: DEFAULT_OPTIONS,
      },
    ];
    const component = await mount(MultiEnginePanel, {
      props: { engines },
    });

    const list = component.getByRole("list", { name: "Engine panels" });
    await expect(list).toHaveClass(/md:grid-cols-2/);
  });

  test("three engines render xl:grid-cols-3 layout", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: DEFAULT_OPTIONS,
      },
      {
        engine: makeStubEngine("lc0", "Leela"),
        searchOptions: DEFAULT_OPTIONS,
      },
      { engine: makeStubEngine("cf", "Cfish"), searchOptions: DEFAULT_OPTIONS },
    ];
    const component = await mount(MultiEnginePanel, {
      props: { engines },
    });

    const list = component.getByRole("list", { name: "Engine panels" });
    await expect(list).toHaveClass(/xl:grid-cols-3/);
  });

  test("uses custom label when provided", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        label: "Main Analysis",
        searchOptions: DEFAULT_OPTIONS,
      },
    ];
    const component = await mount(MultiEnginePanel, {
      props: { engines },
    });

    const summaryItem = component.locator('[aria-label^="Main Analysis"]');
    await expect(summaryItem).toBeVisible();
  });

  test("falls back to engine.name when label is not provided", async ({
    mount,
  }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: DEFAULT_OPTIONS,
      },
    ];
    const component = await mount(MultiEnginePanel, {
      props: { engines },
    });

    const summaryItem = component.locator('[aria-label^="Stockfish 16"]');
    await expect(summaryItem).toBeVisible();
  });

  test("score summary shows dash when engine has no PVs yet", async ({
    mount,
  }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: DEFAULT_OPTIONS,
      },
    ];
    const component = await mount(MultiEnginePanel, {
      props: { engines },
    });

    const summaryItem = component.locator('[aria-label^="Stockfish 16"]');
    await expect(summaryItem).toContainText("—");
  });

  test("separator dividers rendered between engines", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: DEFAULT_OPTIONS,
      },
      {
        engine: makeStubEngine("lc0", "Leela"),
        searchOptions: DEFAULT_OPTIONS,
      },
      { engine: makeStubEngine("cf", "Cfish"), searchOptions: DEFAULT_OPTIONS },
    ];
    const component = await mount(MultiEnginePanel, {
      props: { engines },
    });

    // 3 engines → 2 dividers (v-if="idx > 0")
    const bar = component.getByRole("group", { name: "Score comparison" });
    const dividers = bar.locator('[aria-hidden="true"].w-px');
    await expect(dividers).toHaveCount(2);
  });
});
