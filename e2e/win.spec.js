const { test, expect } = require('@playwright/test');
const {
  getSolution,
  skipWelcome,
  typeWord,
  readStorage,
  openStats,
  closeModal,
} = require('./helpers');

test.describe('winning game', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcome(page);
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
  });

  test("guessing today's solution wins and opens the stats modal", async ({
    page,
  }) => {
    const solution = await getSolution(page);
    const opener = solution === 'ABOUT' ? 'OTHER' : 'ABOUT';

    await typeWord(page, opener);
    await expect
      .poll(async () => (await readStorage(page, 'boardState')).guesses)
      .toEqual([opener]);

    await typeWord(page, solution);
    await expect
      .poll(async () => (await readStorage(page, 'boardState')).guesses)
      .toEqual([opener, solution]);

    await expect(page.getByText('Well done')).toBeVisible({ timeout: 10000 });

    const stats = page.getByRole('heading', { name: /statistics/i });
    await expect(stats).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/played/i).first()).toBeVisible();
    await expect(page.getByText(/guess distribution/i)).toBeVisible();
    await expect(page.getByText(/next word in/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible();

    const gameStats = await readStorage(page, 'gameStats');
    expect(gameStats.totalGames).toBe(1);
    expect(gameStats.currentStreak).toBe(1);
    expect(gameStats.successRate).toBe(100);
    expect(gameStats.winDistribution[1]).toBe(1);

    // Further input is ignored once the game is won.
    await closeModal(page, /statistics/i);
    await typeWord(page, opener);
    await page.waitForTimeout(500);
    expect((await readStorage(page, 'boardState')).guesses).toEqual([
      opener,
      solution,
    ]);

    // Stats persist across reload and can be reopened from the header.
    await page.reload();
    await openStats(page);
    await expect(stats).toBeVisible();
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
    expect((await readStorage(page, 'gameStats')).totalGames).toBe(1);
  });
});
