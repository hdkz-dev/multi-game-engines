import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Switch to English to match assertions (match "English (EN)", "英語 (EN)", or just "EN")
  const enButton = page.getByRole("button", { name: /English \(EN\)|英語 \(EN\)|^EN$/i });
  await enButton.waitFor({ state: "visible", timeout: 15000 });
  await enButton.click();

  // EN ロケールに切り替わったことを英語固有のラベルで確認
  await expect(
    page.getByRole("heading", { name: /ZENITH DASHBOARD/i }),
  ).toBeVisible({
    timeout: 10000,
  });

  await expect(page.getByText("Ready", { exact: true }).first()).toBeVisible({
    timeout: 15000,
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
  // 2. Start search
  const enginePanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  const startButton = enginePanel.getByRole("button", { name: /START/i });
  await startButton.click();

  const stopButton = enginePanel.getByRole("button", { name: /STOP/i });
  await expect(stopButton).toBeVisible({ timeout: 15000 });

  // 3. Stop search
  await stopButton.click();

  // 4. Verify status returns to Ready (START button reappears)
  await expect(startButton).toBeVisible({
    timeout: 10000,
  });
});
