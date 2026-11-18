const { test, expect } = require('@playwright/test');
const { skipWelcome, typeWord, readStorage } = require('./helpers');

const watchRowAnimation = (page, word) =>
  page.waitForFunction(
    w =>
      document.getAnimations().some(animation => {
        const target = animation.effect && animation.effect.target;
        return (
          target &&
          target.childElementCount === 5 &&
          target.textContent.replace(/\s/g, '') === w
        );
      }),
    word,
    { polling: 'raf', timeout: 2000 }
  );

test.describe('invalid guesses', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcome(page);
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
  });

  test('word not in list jiggles the row and shows an alert', async ({
    page,
  }) => {
    await page.keyboard.type('QQQQQ', { delay: 30 });
    const jiggle = watchRowAnimation(page, 'QQQQQ');
    await page.keyboard.press('Enter');
    await jiggle;

    await expect(page.getByText('Not in word list')).toBeVisible();
    expect((await readStorage(page, 'boardState')).guesses).toEqual([]);
  });

  test('too-short guess jiggles the row and shows an alert', async ({
    page,
  }) => {
    await page.keyboard.type('AB', { delay: 30 });
    const jiggle = watchRowAnimation(page, 'AB');
    await page.keyboard.press('Enter');
    await jiggle;

    await expect(page.getByText('Not enough letters')).toBeVisible();
    expect((await readStorage(page, 'boardState')).guesses).toEqual([]);
  });

  test('alert disappears after a short delay', async ({ page }) => {
    await typeWord(page, 'QQQQQ');
    const alert = page.getByText('Not in word list');
    await expect(alert).toBeVisible();
    await expect(alert).toBeHidden({ timeout: 5000 });
  });
});
