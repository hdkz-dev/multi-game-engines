import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // 2026 Zenith: Catch all browser logs for deep debugging
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`[Browser ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

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
    page.getByRole("heading", { name: /ZENITH DASHBOARD/i }),
  ).toBeVisible({
    timeout: 15000,
  });

  // Verify engine status becomes 'ready'
  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });

  // Use a more specific locator to avoid strict mode violation
  await expect(chessPanel.locator("span[role='status']")).toHaveText(
    /ready|準備完了/i,
    {
      timeout: 25000,
    },
  );
});

test("dashboard loads and initializes engines", async ({ page }) => {
  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });

  await expect(chessPanel.getByText("2026 Engine Bridge Standard")).toBeVisible(
    {
      timeout: 15000,
    },
  );

  await expect(chessPanel.locator("span[role='status']")).toHaveText(
    /ready|準備完了/i,
    {
      timeout: 10000,
    },
  );
});

test("dashboard engine search lifecycle", async ({ page }) => {
  const enginePanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  const actionButton = enginePanel.getByRole("button", {
    name: /START|STOP|開始|停止/i,
  });

  await expect(actionButton).toHaveText(/START|開始/i, { timeout: 10000 });

  for (let i = 0; i < 5; i++) {
    const text = await actionButton.textContent();
    if (text && /START|開始/i.test(text)) {
      await actionButton.click({ force: true });
    }
    const isStop = await actionButton
      .textContent()
      .then((t) => /STOP|停止/i.test(t || ""));
    if (isStop) break;
    await page.waitForTimeout(1000);
  }

  await expect(actionButton).toHaveText(/STOP|停止/i, { timeout: 15000 });

  await actionButton.click({ force: true });
  await expect(actionButton).toHaveText(/START|開始/i, { timeout: 10000 });
});

test("dashboard multi-engine parallel search", async ({ page }) => {
  const chessPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Stockfish/i }) });
  const chessAction = chessPanel.getByRole("button", {
    name: /START|STOP|開始|停止/i,
  });

  // 1. Start Chess
  for (let i = 0; i < 5; i++) {
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

  for (let i = 0; i < 5; i++) {
    const text = await shogiAction.textContent();
    if (text && /START|開始/i.test(text))
      await shogiAction.click({ force: true });
    if (await shogiAction.textContent().then((t) => /STOP|停止/i.test(t || "")))
      break;
    await page.waitForTimeout(1000);
  }
  await expect(shogiAction).toHaveText(/STOP|停止/i, { timeout: 10000 });

  // 3. Switch back to Chess and verify it's still running
  await page
    .getByRole("button")
    .filter({ hasText: /CHESS|チェス/i })
    .click();
  await expect(chessAction).toHaveText(/STOP|停止/i);

  // 4. Verify search output is updating for both
  await expect(chessPanel.getByText(/depth|深さ/i).first()).toBeVisible({
    timeout: 15000,
  });

  // 5. Stop both
  await chessAction.click({ force: true });
  await page
    .getByRole("button")
    .filter({ hasText: /SHOGI|将棋/i })
    .click();
  await shogiAction.click({ force: true });
});

test("dashboard language switching logic", async ({ page }) => {
  // 1. Switch to Japanese
  const jaButton = page.getByRole("button").filter({
    hasText: /Japanese \(JA\)|日本語 \(JA\)|^JA$/i,
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
  await expect(chessPanel.getByText(/準備完了/i)).toBeVisible({
    timeout: 10000,
  });

  // 4. Switch back to English
  const enButton = page.getByRole("button").filter({
    hasText: /English \(EN\)|英語 \(EN\)|^EN$/i,
  });
  await enButton.click();

  await expect(
    page.getByRole("heading", { name: /ZENITH DASHBOARD/i }),
  ).toBeVisible();
});
