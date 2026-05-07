import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { StatCard } from "../components/StatCard.js";

/**
 * Component E2E tests for StatCard (React).
 *
 * These tests run in a real Chromium browser via Playwright Component Testing.
 * No GPL engine binaries are loaded — tests use static mock data only (ADR-014).
 *
 * Note: icon prop uses inline <span> — local function components cannot be
 * passed to Playwright CT mount() as they are not serializable.
 */
test.describe("StatCard", () => {
  test("renders label, value and sub text", async ({ mount }) => {
    const component = await mount(
      <StatCard
        icon={<span>★</span>}
        label="Depth"
        value="24"
        sub="selective: 32"
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Depth");
    await expect(component).toContainText("24");
    await expect(component).toContainText("selective: 32");
  });

  test("renders provided icon element", async ({ mount }) => {
    const component = await mount(
      <StatCard
        icon={<span aria-hidden="true">⚡</span>}
        label="Nodes"
        value="1.2M"
        sub="nodes searched"
      />,
    );

    await expect(component).toContainText("⚡");
  });

  test("label text is uppercase styled via CSS class", async ({ mount }) => {
    const component = await mount(
      <StatCard icon={<span>N</span>} label="NPS" value="5M" sub="nodes/s" />,
    );

    const labelEl = component.locator("p").first();
    await expect(labelEl).toContainText("NPS");
    await expect(labelEl).toHaveClass(/uppercase/);
  });

  test("value is displayed in large bold text", async ({ mount }) => {
    const component = await mount(
      <StatCard
        icon={<span>T</span>}
        label="Time"
        value="12.5s"
        sub="elapsed"
      />,
    );

    const valueEl = component.locator("p").nth(1);
    await expect(valueEl).toContainText("12.5s");
    await expect(valueEl).toHaveClass(/font-black/);
  });

  test("sub text is displayed in small italic style", async ({ mount }) => {
    const component = await mount(
      <StatCard
        icon={<span>D</span>}
        label="Depth"
        value="20"
        sub="seldepth: 28"
      />,
    );

    const subEl = component.locator("p").nth(2);
    await expect(subEl).toContainText("seldepth: 28");
    await expect(subEl).toHaveClass(/italic/);
  });

  test("accepts custom className for outer container", async ({ mount }) => {
    const component = await mount(
      <StatCard
        icon={<span>X</span>}
        label="Test"
        value="42"
        sub="units"
        className="custom-card"
      />,
    );

    await expect(component).toHaveClass(/custom-card/);
  });

  test("accepts custom iconClass for icon wrapper", async ({ mount }) => {
    const component = await mount(
      <StatCard
        icon={<span>I</span>}
        label="Test"
        value="1"
        sub="test"
        iconClass="bg-blue-100"
      />,
    );

    // icon wrapper is the first direct-child div of the root
    const iconWrapper = component.locator("> div").first();
    await expect(iconWrapper).toHaveClass(/bg-blue-100/);
  });
});
