import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");

  // 2026: Wait for hydration
  await page.waitForLoadState("networkidle");

  // Switch to English if currently in Japanese (check heading)
  for (let i = 0; i < 5; i++) {
    const heading = page.getByRole("heading", { level: 1 });
    const text = await heading.textContent();

    if (text && /DASHBOARD/i.test(text) && !/ダッシュボード/i.test(text)) {
      break;
    }

    const enButton = page.getByRole("button").filter({
      hasText: /English \(EN\)|英語 \(EN\)|^EN$/i,
    });

    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForTimeout(1000);
    } else {
      await page.waitForTimeout(500);
    }
  }

  // EN ロケールに切り替わったことを英語固有のラベルで確認
  await expect(
    page.getByRole("heading", { name: "ZENITH DASHBOARD" }),
  ).toBeVisible({
    timeout: 15000,
  });

  // 2026 Zenith: Wait for internal engine status to be 'ready' (via UI)
  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });

  await expect(chessPanel.getByRole("status")).toHaveText(/ready|準備完了/i, {
    timeout: 25000,
  });
});

test("vue dashboard loads and initializes engines", async ({ page }) => {
  await expect(page).toHaveTitle(/Zenith Hybrid Analysis Dashboard/);

  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });

  await expect(chessPanel.getByText("2026 Engine Bridge Standard")).toBeVisible(
    {
      timeout: 15000,
    },
  );

  await expect(chessPanel.getByRole("status")).toHaveText(/ready|準備完了/i, {
    timeout: 10000,
  });
});

test("vue dashboard engine search lifecycle", async ({ page }) => {
  const enginePanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });

  // 2026: Get the button and keep clicking until it changes to STOP
  const actionButton = enginePanel.getByRole("button", {
    name: /START|STOP|開始|停止/i,
  });

  for (let i = 0; i < 10; i++) {
    const text = await actionButton.textContent();
    if (text && /START|開始/i.test(text)) {
      await actionButton.click({ force: true });
    } else if (text && /STOP|停止/i.test(text)) {
      break;
    }

    // Check internal error
    const lastError = await page.evaluate(() => {
      type WindowWithLastError = Window & { __LAST_ERROR__?: unknown };
      return (window as WindowWithLastError).__LAST_ERROR__;
    });
    if (lastError) {
      console.error(`[Lifecycle Retry ${i}] Engine Error:`, lastError);
      // Clear error to retry
      await page.evaluate(() => {
        type WindowWithLastError = Window & { __LAST_ERROR__?: unknown };
        (window as WindowWithLastError).__LAST_ERROR__ = null;
      });
    }

    await page.waitForTimeout(1000);
  }

  await expect(actionButton).toHaveText(/STOP|停止/i, { timeout: 10000 });

  // Stop search
  await actionButton.click({ force: true });

  // Verify returns to START
  await expect(actionButton).toHaveText(/START|開始/i, {
    timeout: 10000,
  });
});

test("vue dashboard engine switching", async ({ page }) => {
  await expect(page.getByText(/Stockfish 16.1/i)).toBeVisible();
  await page
    .getByRole("button")
    .filter({ hasText: /SHOGI|将棋/i })
    .click();
  await expect(page.getByText(/Yaneuraou 7.5.0/i)).toBeVisible();

  const shogiPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Yaneuraou/i }) });

  await expect(shogiPanel).toBeVisible({ timeout: 15000 });
});

test("vue dashboard multi-engine parallel search", async ({ page }) => {
  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  const chessAction = chessPanel.getByRole("button", {
    name: /START|STOP|開始|停止/i,
  });

  // 1. Start Chess (with retry)
  for (let i = 0; i < 10; i++) {
    const text = await chessAction.textContent();
    if (text && /START|開始/i.test(text))
      await chessAction.click({ force: true });
    if (await chessAction.textContent().then((t) => /STOP|停止/i.test(t || "")))
      break;
    await page.waitForTimeout(1000);
  }
  await expect(chessAction).toHaveText(/STOP|停止/i, { timeout: 10000 });

  // 2. Switch to Shogi and Start
  await page
    .getByRole("button")
    .filter({ hasText: /SHOGI|将棋/i })
    .click();
  const shogiPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Yaneuraou/i }) });
  const shogiAction = shogiPanel.getByRole("button", {
    name: /START|STOP|開始|停止/i,
  });

  for (let i = 0; i < 10; i++) {
    const text = await shogiAction.textContent();
    if (text && /START|開始/i.test(text))
      await shogiAction.click({ force: true });
    if (await shogiAction.textContent().then((t) => /STOP|停止/i.test(t || "")))
      break;
    await page.waitForTimeout(1000);
  }
  await expect(shogiAction).toHaveText(/STOP|停止/i, { timeout: 10000 });

  // 3. Verify both are running
  await expect(shogiAction).toHaveText(/STOP|停止/i);

  await page
    .getByRole("button")
    .filter({ hasText: /CHESS|チェス/i })
    .click();
  await expect(chessAction).toHaveText(/STOP|停止/i);

  await expect(chessPanel.getByText(/depth|深さ/i)).toBeVisible({
    timeout: 15000,
  });

  await chessAction.click({ force: true });
  await page
    .getByRole("button")
    .filter({ hasText: /SHOGI|将棋/i })
    .click();
  await shogiAction.click({ force: true });
});

test("vue dashboard language switching logic", async ({ page }) => {
  const jaButton = page.getByRole("button").filter({
    hasText: /Japanese \(JA\)|日本語 \(JA\)|^JA$/i,
  });
  await jaButton.click();

  await expect(
    page.getByRole("heading", { name: "ZENITH ダッシュボード" }),
  ).toBeVisible({
    timeout: 10000,
  });

  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  await expect(chessPanel.getByText(/準備完了/i)).toBeVisible({
    timeout: 10000,
  });

  const enButton = page.getByRole("button").filter({
    hasText: /English \(EN\)|英語 \(EN\)|^EN$/i,
  });
  await enButton.click();

  await expect(
    page.getByRole("heading", { name: "ZENITH DASHBOARD" }),
  ).toBeVisible();
});
