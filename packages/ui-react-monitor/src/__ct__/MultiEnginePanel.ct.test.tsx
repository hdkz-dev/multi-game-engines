import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import type {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineStatus,
} from "@multi-game-engines/core";
import { MultiEnginePanel } from "../components/MultiEnginePanel.js";

/**
 * CT tests for MultiEnginePanel (React).
 *
 * Renders multiple stub engines in a single panel and verifies:
 * - Score comparison bar is rendered for each engine
 * - Individual engine panels are rendered in a grid
 * - ARIA roles are correct
 * - Responsive grid classes respond to engine count
 * - Empty engines prop renders nothing
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
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
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

const defaultSearchOptions: IBaseSearchOptions = {};

test.describe("MultiEnginePanel (React CT)", () => {
  test("renders nothing when engines array is empty", async ({ mount }) => {
    const component = await mount(<MultiEnginePanel engines={[]} />);
    // Renders null — the outer section should not exist
    await expect(component).not.toBeVisible();
  });

  test("renders score comparison bar with correct role", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: defaultSearchOptions,
      },
      {
        engine: makeStubEngine("lc0", "Leela Chess Zero"),
        searchOptions: defaultSearchOptions,
      },
    ];
    const component = await mount(<MultiEnginePanel engines={engines} />);

    const bar = component.getByRole("group", { name: "Score comparison" });
    await expect(bar).toBeVisible();
  });

  test("renders engine list with correct ARIA role", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: defaultSearchOptions,
      },
      {
        engine: makeStubEngine("yaneuraou", "Yaneura Ou"),
        searchOptions: defaultSearchOptions,
      },
    ];
    const component = await mount(<MultiEnginePanel engines={engines} />);

    const list = component.getByRole("list", { name: "Engine panels" });
    await expect(list).toBeVisible();
    const items = list.getByRole("listitem");
    await expect(items).toHaveCount(2);
  });

  test("single engine renders grid-cols-1 layout", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: defaultSearchOptions,
      },
    ];
    const component = await mount(<MultiEnginePanel engines={engines} />);

    const list = component.getByRole("list", { name: "Engine panels" });
    await expect(list).toHaveClass(/grid-cols-1/);
  });

  test("two engines render md:grid-cols-2 layout", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: defaultSearchOptions,
      },
      {
        engine: makeStubEngine("lc0", "Leela Chess Zero"),
        searchOptions: defaultSearchOptions,
      },
    ];
    const component = await mount(<MultiEnginePanel engines={engines} />);

    const list = component.getByRole("list", { name: "Engine panels" });
    await expect(list).toHaveClass(/md:grid-cols-2/);
  });

  test("three engines render xl:grid-cols-3 layout", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: defaultSearchOptions,
      },
      {
        engine: makeStubEngine("lc0", "Leela Chess Zero"),
        searchOptions: defaultSearchOptions,
      },
      {
        engine: makeStubEngine("cf", "Cfish"),
        searchOptions: defaultSearchOptions,
      },
    ];
    const component = await mount(<MultiEnginePanel engines={engines} />);

    const list = component.getByRole("list", { name: "Engine panels" });
    await expect(list).toHaveClass(/xl:grid-cols-3/);
  });

  test("uses custom label when provided", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        label: "Main Analysis",
        searchOptions: defaultSearchOptions,
      },
    ];
    const component = await mount(<MultiEnginePanel engines={engines} />);

    // The label appears in the score summary item's aria-label
    const summaryItem = component.locator('[aria-label^="Main Analysis"]');
    await expect(summaryItem).toBeVisible();
  });

  test("falls back to engine.name when label is not provided", async ({
    mount,
  }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: defaultSearchOptions,
      },
    ];
    const component = await mount(<MultiEnginePanel engines={engines} />);

    const summaryItem = component.locator('[aria-label^="Stockfish 16"]');
    await expect(summaryItem).toBeVisible();
  });

  test("score summary shows dash when engine has no PVs yet", async ({
    mount,
  }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: defaultSearchOptions,
      },
    ];
    const component = await mount(<MultiEnginePanel engines={engines} />);

    // Initial state has no PVs, so score display should show "—"
    const summaryItem = component.locator('[aria-label^="Stockfish 16"]');
    await expect(summaryItem).toContainText("—");
  });

  test("separator dividers rendered between engines", async ({ mount }) => {
    const engines = [
      {
        engine: makeStubEngine("sf16", "Stockfish 16"),
        searchOptions: defaultSearchOptions,
      },
      {
        engine: makeStubEngine("lc0", "Leela"),
        searchOptions: defaultSearchOptions,
      },
      {
        engine: makeStubEngine("cf", "Cfish"),
        searchOptions: defaultSearchOptions,
      },
    ];
    const component = await mount(<MultiEnginePanel engines={engines} />);

    // 3 engines → 2 dividers (idx > 0)
    const bar = component.getByRole("group", { name: "Score comparison" });
    const dividers = bar.locator('[aria-hidden="true"].w-px');
    await expect(dividers).toHaveCount(2);
  });
});
