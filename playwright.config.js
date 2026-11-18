// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = 3000;

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  outputDir: './e2e/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: './e2e/playwright-report' }],
      ]
    : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    url: `http://localhost:${PORT}`,
    env: { BROWSER: 'none', PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
