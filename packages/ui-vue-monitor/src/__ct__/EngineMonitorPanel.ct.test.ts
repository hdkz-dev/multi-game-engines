import { test, expect } from "@playwright/experimental-ct-vue";
import type {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineStatus,
} from "@multi-game-engines/core";
import EngineMonitorPanel from "../components/EngineMonitorPanel.vue";

/**
 * Component E2E tests for EngineMonitorPanel (Vue).
 *
 * These tests run in a real Chromium browser via Playwright Component Testing.
 * No GPL engine binaries are loaded — tests use static mock data only (ADR-014).
 *
 * The panel is rendered with a minimal stub IEngine whose status defaults to
 * "ready" so tests can assert on the initial idle state without hooking into
 * a real engine.
 */

type StubEngine = IEngine<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
>;

function makeStubEngine(overrides: Partial<StubEngine> = {}): StubEngine {
  return {
    id: "stub",
    name: "Stub Engine",
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

test.describe("EngineMonitorPanel (Vue)", () => {
  test("renders panel header with title prop", async ({ mount }) => {
    const component = await mount(EngineMonitorPanel, {
      props: {
        engine: makeStubEngine(),
        searchOptions: DEFAULT_OPTIONS,
        title: "Test Engine",
      },
    });

    await expect(component).toBeVisible();
    await expect(component).toContainText("Test Engine");
  });

  test("shows engine name and version in footer", async ({ mount }) => {
    const component = await mount(EngineMonitorPanel, {
      props: {
        engine: makeStubEngine({ name: "Stockfish", version: "16.1" }),
        searchOptions: DEFAULT_OPTIONS,
      },
    });

    await expect(component).toBeVisible();
    await expect(component).toContainText("Stockfish");
    await expect(component).toContainText("16.1");
  });

  test("renders start button when engine is ready", async ({ mount }) => {
    const component = await mount(EngineMonitorPanel, {
      props: {
        engine: makeStubEngine({ status: "ready" }),
        searchOptions: DEFAULT_OPTIONS,
      },
    });

    await expect(component).toBeVisible();
    const startBtn = component.locator("button").first();
    await expect(startBtn).toBeVisible();
  });

  test("renders tablist with PV and Log tabs", async ({ mount }) => {
    const component = await mount(EngineMonitorPanel, {
      props: {
        engine: makeStubEngine(),
        searchOptions: DEFAULT_OPTIONS,
      },
    });

    await expect(component).toBeVisible();
    const tablist = component.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    const tabs = component.locator('[role="tab"]');
    await expect(tabs).toHaveCount(2);
  });

  test("switching to log tab activates log panel", async ({ mount }) => {
    const component = await mount(EngineMonitorPanel, {
      props: {
        engine: makeStubEngine(),
        searchOptions: DEFAULT_OPTIONS,
      },
    });

    const tabs = component.locator('[role="tab"]');
    await tabs.nth(1).click();

    const logPanel = component.locator('[role="tabpanel"]').nth(1);
    await expect(logPanel).not.toHaveAttribute("hidden");
  });

  test("PV tab is active by default", async ({ mount }) => {
    const component = await mount(EngineMonitorPanel, {
      props: {
        engine: makeStubEngine(),
        searchOptions: DEFAULT_OPTIONS,
      },
    });

    const pvTab = component.locator('[role="tab"]').first();
    await expect(pvTab).toHaveAttribute("aria-selected", "true");
  });

  test("renders section with aria-labelledby for accessibility", async ({
    mount,
  }) => {
    const component = await mount(EngineMonitorPanel, {
      props: {
        engine: makeStubEngine(),
        searchOptions: DEFAULT_OPTIONS,
      },
    });

    await expect(component).toHaveAttribute("aria-labelledby", /.+/);
  });

  test("log tab becomes active after click", async ({ mount }) => {
    const component = await mount(EngineMonitorPanel, {
      props: {
        engine: makeStubEngine(),
        searchOptions: DEFAULT_OPTIONS,
      },
    });

    const logTab = component.locator('[role="tab"]').nth(1);
    await logTab.click();
    await expect(logTab).toHaveAttribute("aria-selected", "true");
  });
});
