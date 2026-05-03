import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import type { SearchLogEntry } from "@multi-game-engines/ui-core";
import type { Move } from "@multi-game-engines/core";
import { SearchLog } from "../components/SearchLog.js";

/**
 * Component E2E tests for SearchLog (React).
 *
 * These tests run in a real Chromium browser via Playwright Component Testing.
 * No GPL engine binaries are loaded — tests use static mock data only (ADR-014).
 */
test.describe("SearchLog", () => {
  const makeMove = (s: string): Move => s as unknown as Move;

  const makeEntry = (
    overrides: Partial<SearchLogEntry> = {},
  ): SearchLogEntry => ({
    id: `entry-${Math.random()}`,
    depth: 12,
    score: { type: "cp", value: 100, relativeValue: 100 },
    nodes: 1_500_000,
    nps: 3_000_000,
    time: 500,
    multipv: 1,
    pv: [makeMove("e2e4"), makeMove("c7c5")],
    timestamp: Date.now(),
    ...overrides,
  });

  test("renders empty state when log is empty", async ({ mount }) => {
    const component = await mount(<SearchLog log={[] as SearchLogEntry[]} />);

    await expect(component).toBeVisible();
    // Default locale is Japanese: "探索中..." — no data rows should exist
    const rows = component.locator("tbody tr:not(:has(td[colspan]))");
    await expect(rows).toHaveCount(0);
    // The empty placeholder row with colspan should be present
    await expect(component.locator("tbody td[colspan]")).toBeVisible();
  });

  test("renders a single log entry with depth and score", async ({ mount }) => {
    const component = await mount(
      <SearchLog
        log={[
          makeEntry({
            depth: 18,
            score: { type: "cp", value: 150, relativeValue: 150 },
          }),
        ]}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("18");
    await expect(component).toContainText("+1.50");
  });

  test("renders multiple entries in table rows", async ({ mount }) => {
    const log: SearchLogEntry[] = [
      makeEntry({
        id: "e1",
        depth: 10,
        score: { type: "cp", value: 50, relativeValue: 50 },
      }),
      makeEntry({
        id: "e2",
        depth: 14,
        score: { type: "cp", value: 120, relativeValue: 120 },
      }),
      makeEntry({
        id: "e3",
        depth: 18,
        score: { type: "cp", value: 200, relativeValue: 200 },
      }),
    ];

    const component = await mount(<SearchLog log={log} />);

    await expect(component).toBeVisible();
    const rows = component.locator("tbody tr:not(:has(td[colspan]))");
    await expect(rows).toHaveCount(3);
  });

  test("renders seldepth alongside depth", async ({ mount }) => {
    const entry = makeEntry({ depth: 16, seldepth: 24 });
    const component = await mount(<SearchLog log={[entry]} />);

    await expect(component).toContainText("16");
    await expect(component).toContainText("24");
  });

  test("renders mate score in log entry", async ({ mount }) => {
    const entry = makeEntry({
      score: { type: "mate", value: 5, relativeValue: 5 },
    });
    const component = await mount(<SearchLog log={[entry]} />);

    await expect(component).toBeVisible();
    await expect(component).toContainText("M5");
  });

  test("renders PV moves as clickable buttons", async ({ mount }) => {
    const entry = makeEntry({
      pv: [makeMove("d2d4"), makeMove("d7d5"), makeMove("c2c4")],
    });
    const component = await mount(<SearchLog log={[entry]} />);

    await expect(component).toContainText("d2d4");
    await expect(component).toContainText("d7d5");
    await expect(component).toContainText("c2c4");
  });

  test("calls onMoveClick when a PV move is clicked", async ({ mount }) => {
    const clicked: string[] = [];
    const entry = makeEntry({ pv: [makeMove("e2e4"), makeMove("e7e5")] });

    const component = await mount(
      <SearchLog
        log={[entry]}
        onMoveClick={(move) => {
          clicked.push(move);
        }}
      />,
    );

    const moveBtn = component.locator("tbody button").first();
    await moveBtn.click();
    expect(clicked).toHaveLength(1);
    expect(clicked[0]).toBe("e2e4");
  });

  test("renders table header columns", async ({ mount }) => {
    const component = await mount(<SearchLog log={[]} />);

    await expect(component).toBeVisible();
    const headers = component.locator("thead th");
    // Depth, Score, Time, Nodes, NPS, PV = 6 columns
    await expect(headers).toHaveCount(6);
  });

  test("has accessible role=region attribute", async ({ mount }) => {
    const component = await mount(<SearchLog log={[]} />);

    await expect(component).toHaveAttribute("role", "region");
    await expect(component).toBeVisible();
  });

  test("renders nodes and NPS as formatted numbers", async ({ mount }) => {
    const entry = makeEntry({ nodes: 2_500_000, nps: 5_000_000, time: 500 });
    const component = await mount(<SearchLog log={[entry]} />);

    await expect(component).toBeVisible();
    const rows = component.locator("tbody tr:not(:has(td[colspan]))");
    await expect(rows).toHaveCount(1);
  });
});
