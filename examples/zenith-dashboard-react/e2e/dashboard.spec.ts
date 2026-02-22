import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Switch to English to match assertions (match exact "EN" or localized "英語 (EN)")
  const enButton = page.getByRole("button", { name: /^EN$|英語 \(EN\)/ });
  await enButton.waitFor({ state: "visible", timeout: 15000 });
  await enButton.click();

  // EN ロケールに切り替わったことを英語固有のラベルで確認
  await expect(
    page.getByRole("heading", { name: /ZENITH DASHBOARD/i }),
  ).toBeVisible({
    timeout: 10000,
  });

  await expect(page.getByText("Ready", { exact: true }).first()).toBeVisible({
    timeout: 10000,
  });
});

test("dashboard loads and initializes engines", async ({ page }) => {
  // Check title
  await expect(page).toHaveTitle(/Zenith Hybrid Analysis Dashboard/);

  // Wait for bridge initialization
  const bridgeStatus = page.locator("text=2026 Engine Bridge Standard");
  await expect(bridgeStatus).toBeVisible({ timeout: 15000 });

  // Verify Chess engine status becomes 'ready' within its specific panel
  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  await expect(chessPanel.getByText(/^ready$/i)).toHaveCount(1, {
    timeout: 15000,
  });
});

test("dashboard engine search lifecycle", async ({ page }) => {
  // Filter the Stockfish engine panel specifically
  const enginePanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  const startButton = enginePanel.getByRole("button", { name: /START/i });
  await startButton.click();
  const stopButton = enginePanel.getByRole("button", { name: /STOP/i });
  await expect(stopButton).toBeVisible({ timeout: 10000 });

  // Wait for 'Searching...' status in this panel - narrowing to status role to avoid duplicates
  await expect(
    enginePanel
      .getByRole("status")
      .getByText("Searching...", { exact: true })
      .first(),
  ).toBeVisible({
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
