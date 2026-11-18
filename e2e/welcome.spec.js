const { test, expect } = require('@playwright/test');
const { closeModal, openInfo } = require('./helpers');

test.describe('welcome modal', () => {
  test('shows How to play on first visit and can be closed and reopened', async ({
    page,
  }) => {
    await page.goto('/');
    const title = page.getByRole('heading', { name: /how to play/i });
    await expect(title).toBeVisible();
    await expect(
      page.getByText(/guess the wordle in six tries/i)
    ).toBeVisible();

    await closeModal(page, /how to play/i);
    await expect(title).toBeHidden();

    await openInfo(page);
    await expect(title).toBeVisible();
  });

  test('does not reappear after reload once the game has started', async ({
    page,
  }) => {
    await page.goto('/');
    const title = page.getByRole('heading', { name: /how to play/i });
    await expect(title).toBeVisible();
    await closeModal(page, /how to play/i);

    await page.reload();
    await page.waitForTimeout(1500);
    await expect(title).toBeHidden();
  });
});
