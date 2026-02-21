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

test("dashboard engine search lifecycle", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.click('button:has-text("EN")');
  await expect(page.locator("text=Ready")).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "START", exact: true }).click();
  const stopButton = page.getByRole("button", { name: "STOP", exact: true });
  await expect(stopButton).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.click('button:has-text("STOP")');
  await expect(
    page.getByRole("button", { name: "START", exact: true }),
  ).toBeVisible({ timeout: 10000 });
});
