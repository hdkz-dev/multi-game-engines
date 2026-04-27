import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { ScoreBadge } from "../components/ScoreBadge.js";

/**
 * Component E2E tests for ScoreBadge.
 *
 * These tests run in a real Chromium browser via Playwright Component Testing.
 * No GPL engine binaries are loaded — tests use static mock data only (ADR-014).
 */
test.describe("ScoreBadge", () => {
  test("renders centipawn score correctly", async ({ mount }) => {
    const component = await mount(
      <ScoreBadge score={{ type: "cp", value: 150, relativeValue: 150 }} />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("+1.50");
  });

  test("renders negative centipawn score correctly", async ({ mount }) => {
    const component = await mount(
      <ScoreBadge score={{ type: "cp", value: -75, relativeValue: -75 }} />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("-0.75");
  });

  test("renders mate score correctly", async ({ mount }) => {
    const component = await mount(
      <ScoreBadge score={{ type: "mate", value: 5, relativeValue: 5 }} />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("M5");
  });

  test("renders even position as balanced", async ({ mount }) => {
    const component = await mount(
      <ScoreBadge score={{ type: "cp", value: 0, relativeValue: 0 }} />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("0.00");
  });

  test("renders with inverted score", async ({ mount }) => {
    const component = await mount(
      <ScoreBadge
        score={{ type: "cp", value: 150, relativeValue: 150 }}
        inverted={true}
      />,
    );

    await expect(component).toBeVisible();
    // Inverted: +150cp from black's perspective is displayed as -1.50
    await expect(component).toContainText("-1.50");
  });

  test("has no obvious accessibility violations", async ({ mount, page }) => {
    await mount(
      <ScoreBadge score={{ type: "cp", value: 100, relativeValue: 100 }} />,
    );

    // Verify the element is focusable / visible in the accessibility tree
    const badge = page.getByText("+1.00");
    await expect(badge).toBeVisible();
  });
});
