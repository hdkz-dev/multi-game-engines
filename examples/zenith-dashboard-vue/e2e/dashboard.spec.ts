import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Switch to English to match assertions (using regex to match "英語 (EN)" in JA locale or exact "EN")
  const enButton = page.getByRole("button", { name: /^EN$|英語 \(EN\)/ });
  await enButton.waitFor({ state: "visible", timeout: 15000 });
  await enButton.click();

  // EN ロケールに切り替わったことを英語固有のラベルで確認
  await expect(
    page.getByRole("heading", { name: /ZENITH DASHBOARD/i }),
  ).toBeVisible({
    timeout: 10000,
  });

  // Wait for initial Ready status
  await expect(page.getByText("Ready", { exact: true }).first()).toBeVisible({
    timeout: 15000,
  });
});

test("vue dashboard loads and initializes engines", async ({ page }) => {
  // Check title (Nuxt uses useHead)
  await expect(page).toHaveTitle(/Zenith Hybrid Analysis Dashboard/);

  // Wait for bridge initialization
  await expect(page.getByText("2026 Engine Bridge Standard")).toBeVisible({
    timeout: 15000,
  });

  // Verify engine status becomes 'Ready' within its specific panel
  const activePanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  await expect(activePanel.getByText(/^ready$/i)).toHaveCount(1, {
    timeout: 15000,
  });
});

test("vue dashboard engine search lifecycle", async ({ page }) => {
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

test("vue dashboard engine switching", async ({ page }) => {
  // 1. Initial engine should be Chess
  await expect(page.getByText(/Stockfish 16.1/i)).toBeVisible();

  // 2. Switch to Shogi
  await page.getByRole("button", { name: /SHOGI/i }).click();
  await expect(page.getByText(/Yaneuraou 7.5.0/i)).toBeVisible();

  // 3. Verify Shogi board elements
  const senteHand = page.getByLabel(/Sente Hand/i);
  await expect(senteHand).toBeVisible({ timeout: 10000 });
});
