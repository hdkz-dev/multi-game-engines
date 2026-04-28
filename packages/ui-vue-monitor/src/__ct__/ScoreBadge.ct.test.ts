import { test, expect } from "@playwright/experimental-ct-vue";
import ScoreBadge from "../components/ScoreBadge.vue";

/**
 * Component E2E tests for ScoreBadge (Vue).
 *
 * These tests run in a real Chromium browser via Playwright Component Testing.
 * No GPL engine binaries are loaded — tests use static mock data only (ADR-014).
 */
test.describe("ScoreBadge (Vue)", () => {
  test("renders centipawn score correctly", async ({ mount }) => {
    const component = await mount(ScoreBadge, {
      props: {
        score: { type: "cp", value: 150, relativeValue: 150 },
      },
    });

    await expect(component).toBeVisible();
    await expect(component).toContainText("+1.50");
  });

  test("renders negative centipawn score correctly", async ({ mount }) => {
    const component = await mount(ScoreBadge, {
      props: {
        score: { type: "cp", value: -75, relativeValue: -75 },
      },
    });

    await expect(component).toBeVisible();
    await expect(component).toContainText("-0.75");
  });

  test("renders mate score correctly", async ({ mount }) => {
    const component = await mount(ScoreBadge, {
      props: {
        score: { type: "mate", value: 5, relativeValue: 5 },
      },
    });

    await expect(component).toBeVisible();
    await expect(component).toContainText("M5");
  });

  test("renders even position as balanced", async ({ mount }) => {
    const component = await mount(ScoreBadge, {
      props: {
        score: { type: "cp", value: 0, relativeValue: 0 },
      },
    });

    await expect(component).toBeVisible();
    await expect(component).toContainText("0.00");
  });

  test("renders with inverted score", async ({ mount }) => {
    const component = await mount(ScoreBadge, {
      props: {
        score: { type: "cp", value: 150, relativeValue: 150 },
        inverted: true,
      },
    });

    await expect(component).toBeVisible();
    // Inverted: +150cp from black's perspective is displayed as -1.50
    await expect(component).toContainText("-1.50");
  });

  test("has role=status for accessibility", async ({ mount }) => {
    const component = await mount(ScoreBadge, {
      props: {
        score: { type: "cp", value: 100, relativeValue: 100 },
      },
    });

    await expect(component).toBeVisible();
    await expect(component).toContainText("+1.00");
    // Verify the role attribute is present for screen readers
    await expect(component).toHaveAttribute("role", "status");
  });
});
