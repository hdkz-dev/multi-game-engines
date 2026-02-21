import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // Switch to English to match assertions
  await page.click('button:has-text("EN")');
  await expect(page.locator("text=Ready")).toBeVisible({ timeout: 10000 });
});

test("dashboard loads and initializes engines", async ({ page }) => {
  // Check title
  await expect(page).toHaveTitle(/Zenith Hybrid Analysis Dashboard/);

  // Wait for bridge initialization
  const bridgeStatus = page.locator("text=2026 Engine Bridge Standard");
  await expect(bridgeStatus).toBeVisible({ timeout: 15000 });

  // Verify Chess engine status becomes 'ready'
  await expect(page.locator("text=ready")).toHaveCount(1, { timeout: 15000 });
});

test("dashboard engine search lifecycle", async ({ page }) => {
  const enginePanel = page
    .locator("section, div")
    .filter({ hasText: /Stockfish/i })
    .first();
  const startButton = enginePanel.getByRole("button", { name: /START/i });
  await startButton.click();
  const stopButton = enginePanel.getByRole("button", { name: /STOP/i });
  await expect(stopButton).toBeVisible({ timeout: 10000 });

  // Wait for 'Searching...' status in this panel
  await expect(enginePanel.getByText(/Searching.../i).first()).toBeVisible({
    timeout: 10000,
  });

  // Wait for unique score from mock (+0.15 for cp 15)
  await expect(enginePanel.getByText("+0.15").first()).toBeVisible({
    timeout: 10000,
  });

  // Wait for search progress (best move appearing)
  await expect(enginePanel.getByText("e2e4").first()).toBeVisible({
    timeout: 10000,
  });

  await stopButton.click();
  await expect(startButton).toBeVisible({ timeout: 10000 });
});
