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
