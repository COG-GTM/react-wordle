const { test, expect } = require('@playwright/test');
const {
  skipWelcome,
  openSettings,
  closeModal,
  darkModeToggle,
  isToggleOn,
  readStorage,
} = require('./helpers');

const bodyTheme = page => page.locator('body').getAttribute('data-theme');

test.describe('dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcome(page);
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
  });

  test('toggle persists across reload', async ({ page }) => {
    await expect.poll(() => bodyTheme(page)).toBe('dark');

    await openSettings(page);
    await expect(page.getByText('Dark Mode', { exact: true })).toBeVisible();
    let toggle = await darkModeToggle(page);
    expect(await isToggleOn(toggle)).toBe(true);

    await toggle.dispatchEvent('click');
    await expect.poll(() => isToggleOn(toggle)).toBe(false);
    await expect.poll(() => bodyTheme(page)).toBeNull();
    expect(await readStorage(page, 'theme')).toBe('light');
    await closeModal(page, /setting/i);

    await page.reload();
    await expect(page.locator('header')).toBeVisible();
    await expect.poll(() => bodyTheme(page)).toBeNull();

    await openSettings(page);
    toggle = await darkModeToggle(page);
    expect(await isToggleOn(toggle)).toBe(false);

    await toggle.dispatchEvent('click');
    await expect.poll(() => bodyTheme(page)).toBe('dark');
    await closeModal(page, /setting/i);

    await page.reload();
    await expect(page.locator('header')).toBeVisible();
    await expect.poll(() => bodyTheme(page)).toBe('dark');
    expect(await readStorage(page, 'theme')).toBe('dark');
  });
});
