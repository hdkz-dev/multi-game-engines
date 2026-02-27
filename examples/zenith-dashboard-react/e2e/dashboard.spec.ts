import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Switch to English to match assertions (match "English (EN)", "英語 (EN)", or just "EN")
  const enButton = page.getByRole("button", {
    name: /English \(EN\)|英語 \(EN\)|^EN$/i,
  });
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

test("dashboard multi-engine parallel search", async ({ page }) => {
  // 1. Identify panels for different engines
  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  const shogiPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Yaneuraou/i }) });

  // 2. Start both engines
  await chessPanel.getByRole("button", { name: /START/i }).click();
  await shogiPanel.getByRole("button", { name: /START/i }).click();

  // 3. Verify both are running (STOP buttons visible)
  await expect(chessPanel.getByRole("button", { name: /STOP/i })).toBeVisible();
  await expect(shogiPanel.getByRole("button", { name: /STOP/i })).toBeVisible();

  // 4. Verify search output is updating for both (non-zero nodes/depth)
  // This assumes the UI shows nodes or depth which increases
  await expect(chessPanel.getByText(/depth:/i)).toBeVisible({
    timeout: 15000,
  });
  await expect(shogiPanel.getByText(/depth:/i)).toBeVisible({
    timeout: 15000,
  });

  // 5. Stop both
  await chessPanel.getByRole("button", { name: /STOP/i }).click();
  await shogiPanel.getByRole("button", { name: /STOP/i }).click();
});

test("dashboard language switching logic", async ({ page }) => {
  // 1. Switch to Japanese
  const jaButton = page.getByRole("button", {
    name: /Japanese \(JA\)|日本語 \(JA\)|^JA$/i,
  });
  await jaButton.click();

  // 2. Verify heading changed to Japanese
  await expect(
    page.getByRole("heading", { name: /ZENITH ダッシュボード/i }),
  ).toBeVisible({
    timeout: 10000,
  });

  // 3. Verify labels in panels are translated
  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  // Assuming "Ready" translates to "準備完了" or similar in i18n-dashboard
  await expect(chessPanel.getByText(/準備完了/i)).toBeVisible({
    timeout: 10000,
  });

  // 4. Switch back to English
  const enButton = page.getByRole("button", {
    name: /English \(EN\)|英語 \(EN\)|^EN$/i,
  });
  await enButton.click();

  await expect(
    page.getByRole("heading", { name: /ZENITH DASHBOARD/i }),
  ).toBeVisible();
});
