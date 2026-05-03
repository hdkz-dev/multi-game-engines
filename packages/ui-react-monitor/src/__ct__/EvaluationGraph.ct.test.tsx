import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import type { IEvaluationHistoryEntry } from "@multi-game-engines/ui-core";
import { EvaluationGraph } from "../components/EvaluationGraph.js";

/**
 * Component E2E tests for EvaluationGraph (React).
 *
 * These tests run in a real Chromium browser via Playwright Component Testing.
 * No GPL engine binaries are loaded — tests use static mock data only (ADR-014).
 */
test.describe("EvaluationGraph", () => {
  test("renders with no entries (empty state)", async ({ mount }) => {
    const component = await mount(
      <EvaluationGraph entries={[] as IEvaluationHistoryEntry[]} />,
    );

    await expect(component).toBeVisible();
    await expect(component.locator("svg")).toBeVisible();
  });

  test("renders with a single entry", async ({ mount }) => {
    const entries: IEvaluationHistoryEntry[] = [
      { score: { type: "cp", value: 100, relativeValue: 100 }, timestamp: 1 },
    ];

    const component = await mount(<EvaluationGraph entries={entries} />);

    await expect(component).toBeVisible();
    await expect(component.locator("svg")).toBeVisible();
  });

  test("renders path for multiple entries", async ({ mount }) => {
    const entries: IEvaluationHistoryEntry[] = [
      { score: { type: "cp", value: 0, relativeValue: 0 }, timestamp: 1 },
      { score: { type: "cp", value: 100, relativeValue: 100 }, timestamp: 2 },
      { score: { type: "cp", value: 200, relativeValue: 200 }, timestamp: 3 },
    ];

    const component = await mount(<EvaluationGraph entries={entries} />);

    await expect(component).toBeVisible();
    await expect(component.locator("path")).toBeVisible();
    // Latest point dot
    await expect(component.locator("circle")).toBeVisible();
  });

  test("renders with negative score entries", async ({ mount }) => {
    const entries: IEvaluationHistoryEntry[] = [
      {
        score: { type: "cp", value: -300, relativeValue: -300 },
        timestamp: 1,
      },
      {
        score: { type: "cp", value: -150, relativeValue: -150 },
        timestamp: 2,
      },
    ];

    const component = await mount(<EvaluationGraph entries={entries} />);

    await expect(component).toBeVisible();
    await expect(component.locator("path")).toBeVisible();
  });

  test("renders with mate score entry", async ({ mount }) => {
    const entries: IEvaluationHistoryEntry[] = [
      { score: { type: "mate", value: 3, relativeValue: 3 }, timestamp: 1 },
    ];

    const component = await mount(<EvaluationGraph entries={entries} />);

    await expect(component).toBeVisible();
    await expect(component.locator("svg")).toBeVisible();
  });

  test("applies custom height via inline style", async ({ mount }) => {
    const component = await mount(
      <EvaluationGraph entries={[]} height={120} />,
    );

    await expect(component).toBeVisible();
    await expect(component).toHaveAttribute("style", /height.*120/);
  });

  test("has accessible role=img attribute", async ({ mount }) => {
    const component = await mount(<EvaluationGraph entries={[]} />);

    await expect(component).toHaveAttribute("role", "img");
  });

  test("renders dashed zero-line inside SVG", async ({ mount }) => {
    const entries: IEvaluationHistoryEntry[] = [
      { score: { type: "cp", value: 50, relativeValue: 50 }, timestamp: 1 },
    ];

    const component = await mount(<EvaluationGraph entries={entries} />);

    await expect(component).toBeVisible();
    await expect(component.locator("line[stroke-dasharray]")).toHaveCount(1);
  });
});
