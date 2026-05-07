import { test, expect } from "@playwright/experimental-ct-vue";
import type { SearchStatistics } from "@multi-game-engines/ui-core";
import EngineStats from "../components/EngineStats.vue";

/**
 * Component E2E tests for EngineStats (Vue).
 *
 * These tests run in a real Chromium browser via Playwright Component Testing.
 * No GPL engine binaries are loaded — tests use static mock data only (ADR-014).
 */
test.describe("EngineStats (Vue)", () => {
  const makeStats = (
    overrides: Partial<SearchStatistics> = {},
  ): SearchStatistics => ({
    depth: 20,
    nodes: 2_500_000,
    nps: 5_000_000,
    time: 500,
    ...overrides,
  });

  test("renders depth value when visits is undefined", async ({ mount }) => {
    const component = await mount(EngineStats, {
      props: { stats: makeStats({ depth: 18 }) },
    });

    await expect(component).toBeVisible();
    await expect(component).toContainText("18");
  });

  test("renders seldepth alongside depth when provided", async ({ mount }) => {
    const component = await mount(EngineStats, {
      props: { stats: makeStats({ depth: 18, seldepth: 26 }) },
    });

    await expect(component).toBeVisible();
    await expect(component).toContainText("18");
    await expect(component).toContainText("26");
  });

  test("renders visits count when visits > 0", async ({ mount }) => {
    const component = await mount(EngineStats, {
      props: { stats: makeStats({ depth: 10, visits: 80_000 }) },
    });

    await expect(component).toBeVisible();
    // formatNumber(80_000) = "80.0k"
    await expect(component).toContainText("80.0k");
  });

  test("renders nodes count", async ({ mount }) => {
    const component = await mount(EngineStats, {
      props: { stats: makeStats({ nodes: 1_234_567 }) },
    });

    await expect(component).toBeVisible();
    // formatNumber(1_234_567) = "1.2M"
    await expect(component).toContainText("1.2M");
  });

  test("renders NPS count", async ({ mount }) => {
    const component = await mount(EngineStats, {
      props: { stats: makeStats({ nps: 3_000_000 }) },
    });

    await expect(component).toBeVisible();
    // formatNumber(3_000_000) = "3.0M"
    await expect(component).toContainText("3.0M");
  });

  test("renders elapsed time in seconds", async ({ mount }) => {
    const component = await mount(EngineStats, {
      props: { stats: makeStats({ time: 12_500 }) },
    });

    await expect(component).toBeVisible();
    // formatTime(12500) = "12.5"
    await expect(component).toContainText("12.5");
  });

  test("renders four stat boxes in grid layout", async ({ mount }) => {
    const component = await mount(EngineStats, {
      props: { stats: makeStats() },
    });

    await expect(component).toBeVisible();
    // 4 stat boxes: depth/visits, nodes, nps, time
    const boxes = component.locator(".flex-col.gap-1");
    await expect(boxes).toHaveCount(4);
  });

  test("accepts custom className prop", async ({ mount }) => {
    const component = await mount(EngineStats, {
      props: { stats: makeStats(), className: "custom-stats" },
    });

    await expect(component).toHaveClass(/custom-stats/);
  });
});
