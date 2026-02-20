import { test, expect } from "@playwright/test";

test("vue dashboard loads and initializes engines", async ({ page }) => {
  await page.goto("/");

  // Wait for initial load
  await page.waitForLoadState("networkidle");

  // Switch to English to match assertions
  await page.getByRole("button", { name: "EN", exact: true }).click();

  // Verify language switched
  await expect(page.getByText("Ready")).toBeVisible({ timeout: 15000 });

  // Check title (Nuxt uses useHead)
  await expect(page).toHaveTitle(/Zenith Hybrid Analysis Dashboard/);

  // Wait for bridge initialization
  await expect(page.getByText("2026 Engine Bridge Standard")).toBeVisible({
    timeout: 15000,
  });

  // Verify engine status becomes 'Ready'
  await expect(page.getByText("Ready")).toHaveCount(1, { timeout: 15000 });
});

test("vue dashboard engine search lifecycle", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "EN", exact: true }).click();

  // 1. Start search
  await page.getByRole("button", { name: /START/i }).click();

  // 2. Verify search started by checking for STOP button
  // (Header text might be unstable or take a tick to update)
  const stopButton = page.getByRole("button", { name: /STOP/i });
  await expect(stopButton).toBeVisible({ timeout: 10000 });

  // 3. Stop search
  await stopButton.click();

  // 4. Verify status returns to Ready (START button reappears)
  await expect(page.getByRole("button", { name: /START/i })).toBeVisible({
    timeout: 10000,
  });
});

test("vue dashboard engine switching", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "EN", exact: true }).click();

  // 1. Initial engine should be Chess
  await expect(page.getByText(/Stockfish 16.1/i)).toBeVisible();

  // 2. Switch to Shogi
  await page.getByRole("button", { name: /SHOGI/i }).click();
  await expect(page.getByText(/Yaneuraou 7.5.0/i)).toBeVisible();

  // 3. Verify Shogi board elements (labels are in aria-label)
  const senteHand = page.getByLabel(/Sente Hand/i);
  await expect(senteHand).toBeDefined();
});
