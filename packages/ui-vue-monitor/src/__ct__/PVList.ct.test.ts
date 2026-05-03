import { test, expect } from "@playwright/experimental-ct-vue";
import type { PrincipalVariation } from "@multi-game-engines/ui-core";
import type { Move } from "@multi-game-engines/core";
import PVList from "../components/PVList.vue";

/**
 * Component E2E tests for PVList (Vue).
 *
 * These tests run in a real Chromium browser via Playwright Component Testing.
 * No GPL engine binaries are loaded — tests use static mock data only (ADR-014).
 */
test.describe("PVList (Vue)", () => {
  const makeMove = (s: string): Move => s as unknown as Move;

  test("renders empty state when no PVs provided", async ({ mount }) => {
    const component = await mount(PVList, {
      props: { pvs: [] as PrincipalVariation[] },
    });

    await expect(component).toBeVisible();
    // Should show searching placeholder
    await expect(component).toContainText(/search/i);
  });

  test("renders a single PV with centipawn score", async ({ mount }) => {
    const pvs: PrincipalVariation[] = [
      {
        multipv: 1,
        score: { type: "cp", value: 250, relativeValue: 250 },
        moves: [makeMove("e2e4"), makeMove("e7e5"), makeMove("g1f3")],
      },
    ];

    const component = await mount(PVList, { props: { pvs } });

    await expect(component).toBeVisible();
    await expect(component).toContainText("+2.50");
    await expect(component).toContainText("e2e4");
    await expect(component).toContainText("e7e5");
    await expect(component).toContainText("g1f3");
  });

  test("renders multiple PVs with ranking labels", async ({ mount }) => {
    const pvs: PrincipalVariation[] = [
      {
        multipv: 1,
        score: { type: "cp", value: 200, relativeValue: 200 },
        moves: [makeMove("e2e4")],
      },
      {
        multipv: 2,
        score: { type: "cp", value: 80, relativeValue: 80 },
        moves: [makeMove("d2d4")],
      },
      {
        multipv: 3,
        score: { type: "cp", value: -10, relativeValue: -10 },
        moves: [makeMove("c2c4")],
      },
    ];

    const component = await mount(PVList, { props: { pvs } });

    await expect(component).toBeVisible();
    await expect(component).toContainText("#1");
    await expect(component).toContainText("#2");
    await expect(component).toContainText("#3");
    await expect(component).toContainText("+2.00");
    await expect(component).toContainText("+0.80");
    await expect(component).toContainText("-0.10");
  });

  test("renders mate score in PV", async ({ mount }) => {
    const pvs: PrincipalVariation[] = [
      {
        multipv: 1,
        score: { type: "mate", value: 2, relativeValue: 2 },
        moves: [makeMove("d1h5"), makeMove("g6h5")],
      },
    ];

    const component = await mount(PVList, { props: { pvs } });

    await expect(component).toBeVisible();
    await expect(component).toContainText("M2");
  });

  test("first move in PV is visually emphasised", async ({ mount }) => {
    const pvs: PrincipalVariation[] = [
      {
        multipv: 1,
        score: { type: "cp", value: 100, relativeValue: 100 },
        moves: [makeMove("e2e4"), makeMove("c7c5")],
      },
    ];

    const component = await mount(PVList, { props: { pvs } });

    // First move button should have font-bold class
    const firstMoveBtn = component.locator("button").first();
    await expect(firstMoveBtn).toHaveClass(/font-bold/);
  });

  test("emits move-click event when a move is clicked", async ({ mount }) => {
    const clickedMoves: string[] = [];
    const pvs: PrincipalVariation[] = [
      {
        multipv: 1,
        score: { type: "cp", value: 50, relativeValue: 50 },
        moves: [makeMove("e2e4"), makeMove("e7e5")],
      },
    ];

    const component = await mount(PVList, {
      props: { pvs },
      on: {
        "move-click": (move: string) => {
          clickedMoves.push(move);
        },
      },
    });

    await component.locator("button").first().click();
    expect(clickedMoves).toHaveLength(1);
    expect(clickedMoves[0]).toBe("e2e4");
  });

  test("move buttons have accessible aria-label", async ({ mount }) => {
    const pvs: PrincipalVariation[] = [
      {
        multipv: 1,
        score: { type: "cp", value: 100, relativeValue: 100 },
        moves: [makeMove("g1f3")],
      },
    ];

    const component = await mount(PVList, { props: { pvs } });

    const moveBtn = component.locator("button").first();
    await expect(moveBtn).toHaveAttribute("aria-label", /.+/);
  });
});
