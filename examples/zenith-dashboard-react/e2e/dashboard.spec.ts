import { test, expect } from "@playwright/test";

test("dashboard loads and initializes engines", async ({ page }) => {
  await page.goto("/");

  // Wait for initial load
  await page.waitForLoadState("networkidle");

  // Switch to English to match assertions (using more specific selector)
  await page.click('button:has-text("EN")');

  // Verify language switched (optional but good for robustness)
  await expect(page.locator("text=Ready")).toBeVisible({ timeout: 10000 });

  // Check title
  await expect(page).toHaveTitle(/Zenith Hybrid Analysis Dashboard/);

  // Wait for bridge initialization (engines might take time to load WASM)
  const bridgeStatus = page.locator("text=2026 Engine Bridge Standard");
  await expect(bridgeStatus).toBeVisible({ timeout: 15000 });

  // Verify Chess engine status becomes 'ready'
  await expect(page.locator("text=ready")).toHaveCount(1, { timeout: 15000 });
});
